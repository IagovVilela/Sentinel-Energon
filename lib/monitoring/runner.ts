import { prisma } from "@/lib/db";
import { executeCheck } from "@/lib/monitoring/executor";
import { refreshProjectStatus } from "@/lib/project-status";
import {
  notifyIncidentDown,
  notifyIncidentRecovery,
  notifyIncidentReminder,
} from "@/lib/monitoring/notify";
import { formatDuration } from "@/lib/utils";

export async function runHealthCheck(healthCheckId: string) {
  const check = await prisma.healthCheck.findUnique({
    where: { id: healthCheckId },
    include: {
      service: { include: { project: true } },
    },
  });
  if (!check || !check.enabled) return null;

  // Silence during maintenance
  const now = new Date();
  const maintenance = await prisma.maintenanceWindow.findFirst({
    where: {
      projectId: check.service.projectId,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
  });

  const exec = await executeCheck(check);
  const status = exec.ok ? "ok" : "fail";

  await prisma.checkResult.create({
    data: {
      healthCheckId: check.id,
      status,
      httpStatus: exec.httpStatus,
      latencyMs: exec.latencyMs,
      errorMessage: exec.errorMessage,
    },
  });

  let consecutiveFails = check.consecutiveFails;
  if (status === "fail") consecutiveFails += 1;
  else consecutiveFails = 0;

  await prisma.healthCheck.update({
    where: { id: check.id },
    data: {
      consecutiveFails,
      lastStatus: status,
      lastCheckedAt: now,
      lastLatencyMs: exec.latencyMs,
    },
  });

  const wasDown = check.lastStatus === "fail" && check.consecutiveFails >= check.failureThreshold;
  const isDown = consecutiveFails >= check.failureThreshold;

  if (!maintenance) {
    if (isDown && !wasDown) {
      const incident = await prisma.incident.create({
        data: {
          projectId: check.service.projectId,
          serviceId: check.serviceId,
          healthCheckId: check.id,
          status: "open",
          cause: exec.errorMessage || "Check falhou",
          startedAt: now,
          lastNotifiedAt: now,
        },
      });
      await notifyIncidentDown({
        incidentId: incident.id,
        project: check.service.project,
        service: check.service,
        check,
        error: exec.errorMessage || "Check falhou",
        at: now,
        consecutiveFails,
        lastLatencyMs: exec.latencyMs,
        httpStatus: exec.httpStatus,
      });
    }

    if (!isDown && wasDown) {
      const open = await prisma.incident.findFirst({
        where: {
          healthCheckId: check.id,
          status: "open",
        },
        orderBy: { startedAt: "desc" },
      });
      if (open) {
        const durationMs = now.getTime() - open.startedAt.getTime();
        await prisma.incident.update({
          where: { id: open.id },
          data: {
            status: "resolved",
            endedAt: now,
            durationMs,
          },
        });
        await notifyIncidentRecovery({
          project: check.service.project,
          service: check.service,
          check,
          duration: formatDuration(durationMs),
          at: now,
          lastLatencyMs: exec.latencyMs,
          httpStatus: exec.httpStatus,
        });
      }
    }

    // Reminders for open incidents
    if (isDown) {
      const open = await prisma.incident.findFirst({
        where: { healthCheckId: check.id, status: "open" },
      });
      if (open) {
        const reminderHours = Number(process.env.INCIDENT_REMINDER_HOURS || 4);
        const last = open.lastNotifiedAt || open.startedAt;
        const due =
          now.getTime() - last.getTime() >= reminderHours * 60 * 60 * 1000;
        if (due) {
          await notifyIncidentReminder({
            project: check.service.project,
            service: check.service,
            check,
            startedAt: open.startedAt,
            at: now,
            consecutiveFails,
            lastLatencyMs: exec.latencyMs,
            httpStatus: exec.httpStatus,
            error: exec.errorMessage || open.cause || "Check falhou",
          });
          await prisma.incident.update({
            where: { id: open.id },
            data: { lastNotifiedAt: now },
          });
        }
      }
    }
  }

  await refreshProjectStatus(check.service.projectId);

  return {
    status,
    latencyMs: exec.latencyMs,
    httpStatus: exec.httpStatus,
    errorMessage: exec.errorMessage,
    consecutiveFails,
    isDown,
  };
}

export async function runDueChecks() {
  const checks = await prisma.healthCheck.findMany({
    where: { enabled: true },
  });
  const now = Date.now();
  const due = checks.filter((c) => {
    if (!c.lastCheckedAt) return true;
    return now - c.lastCheckedAt.getTime() >= c.intervalSec * 1000;
  });

  for (const check of due) {
    await runHealthCheck(check.id);
  }
  return due.length;
}
