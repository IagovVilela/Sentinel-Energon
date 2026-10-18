import type { HealthCheck, Project, Service } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  downEmailHtml,
  expiryEmailHtml,
  recoveryEmailHtml,
  sendEmail,
} from "@/lib/email";
import { formatDuration } from "@/lib/utils";

function panelUrl(projectId: string) {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}/projects/${projectId}`;
}

async function recipients(filter: {
  notifyDown?: boolean;
  notifyRecovery?: boolean;
  notifyExpiry?: boolean;
}) {
  return prisma.alertRule.findMany({
    where: {
      enabled: true,
      ...(filter.notifyDown ? { notifyDown: true } : {}),
      ...(filter.notifyRecovery ? { notifyRecovery: true } : {}),
      ...(filter.notifyExpiry ? { notifyExpiry: true } : {}),
    },
  });
}

type NotifyContext = {
  project: Project;
  service: Service;
  check: HealthCheck;
  at: Date;
  consecutiveFails?: number | null;
  lastLatencyMs?: number | null;
  httpStatus?: number | null;
  error?: string;
};

export async function notifyIncidentDown(
  opts: NotifyContext & { incidentId: string; error: string },
) {
  const rules = await recipients({ notifyDown: true });
  const html = downEmailHtml({
    projectName: opts.project.name,
    environment: opts.project.environment,
    serviceName: opts.service.name,
    checkName: opts.check.name,
    checkUrl: opts.check.url,
    error: opts.error,
    at: opts.at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    consecutiveFails: opts.consecutiveFails,
    lastLatencyMs: opts.lastLatencyMs,
    httpStatus: opts.httpStatus,
    adminUrl: opts.service.adminUrl,
    hostingUrl: opts.service.hostingUrl,
    gitUrl: opts.service.gitUrl,
    panelUrl: panelUrl(opts.project.id),
  });
  for (const rule of rules) {
    await sendEmail({
      to: rule.email,
      subject: `[Energon] Fora do ar: ${opts.project.name} / ${opts.service.name}`,
      html,
      eventType: "incident_down",
      alertRuleId: rule.id,
      metadata: { incidentId: opts.incidentId },
    });
  }
}

export async function notifyIncidentRecovery(
  opts: NotifyContext & { duration: string },
) {
  const rules = await recipients({ notifyRecovery: true });
  const html = recoveryEmailHtml({
    projectName: opts.project.name,
    environment: opts.project.environment,
    serviceName: opts.service.name,
    checkName: opts.check.name,
    checkUrl: opts.check.url,
    duration: opts.duration,
    at: opts.at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    lastLatencyMs: opts.lastLatencyMs,
    adminUrl: opts.service.adminUrl,
    hostingUrl: opts.service.hostingUrl,
    gitUrl: opts.service.gitUrl,
    panelUrl: panelUrl(opts.project.id),
  });
  for (const rule of rules) {
    await sendEmail({
      to: rule.email,
      subject: `[Energon] Recuperado: ${opts.project.name} / ${opts.service.name}`,
      html,
      eventType: "incident_recovery",
      alertRuleId: rule.id,
    });
  }
}

export async function notifyIncidentReminder(
  opts: NotifyContext & { startedAt: Date },
) {
  const rules = await recipients({ notifyDown: true });
  const duration = formatDuration(opts.at.getTime() - opts.startedAt.getTime());
  const html = downEmailHtml({
    projectName: opts.project.name,
    environment: opts.project.environment,
    serviceName: opts.service.name,
    checkName: opts.check.name,
    checkUrl: opts.check.url,
    error: opts.error || `Incidente ainda aberto (duração ${duration})`,
    at: opts.at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    consecutiveFails: opts.consecutiveFails,
    lastLatencyMs: opts.lastLatencyMs,
    httpStatus: opts.httpStatus,
    duration,
    reminder: true,
    adminUrl: opts.service.adminUrl,
    hostingUrl: opts.service.hostingUrl,
    gitUrl: opts.service.gitUrl,
    panelUrl: panelUrl(opts.project.id),
  });
  for (const rule of rules) {
    await sendEmail({
      to: rule.email,
      subject: `[Energon] Lembrete: fora do ar ${opts.project.name} / ${opts.service.name}`,
      html,
      eventType: "incident_reminder",
      alertRuleId: rule.id,
    });
  }
}

export async function processExpiryAlerts() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const credentials = await prisma.credential.findMany({
    where: {
      expiresAt: { not: null, lte: in30, gte: now },
    },
    include: {
      service: { include: { project: true } },
    },
  });

  const rules = await recipients({ notifyExpiry: true });

  for (const cred of credentials) {
    if (!cred.expiresAt) continue;
    const daysLeft = Math.ceil(
      (cred.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    let shouldNotify = false;
    const data: Record<string, boolean> = {};

    if (daysLeft <= 1 && !cred.expiryNotified1) {
      shouldNotify = true;
      data.expiryNotified1 = true;
      data.expiryNotified7 = true;
      data.expiryNotified30 = true;
    } else if (daysLeft <= 7 && !cred.expiryNotified7 && cred.expiresAt <= in7) {
      shouldNotify = true;
      data.expiryNotified7 = true;
      data.expiryNotified30 = true;
    } else if (daysLeft <= 30 && !cred.expiryNotified30 && cred.expiresAt <= in30) {
      shouldNotify = true;
      data.expiryNotified30 = true;
    }

    if (!shouldNotify) continue;

    const html = expiryEmailHtml({
      kind: "Credencial",
      label: cred.label,
      projectName: cred.service.project.name,
      serviceName: cred.service.name,
      expiresAt: cred.expiresAt.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      daysLeft,
      panelUrl: panelUrl(cred.service.projectId),
    });

    for (const rule of rules) {
      await sendEmail({
        to: rule.email,
        subject: `[Energon] Expiração em ${daysLeft}d: ${cred.label}`,
        html,
        eventType: "credential_expiry",
        alertRuleId: rule.id,
        metadata: { credentialId: cred.id, daysLeft },
      });
    }

    await prisma.credential.update({
      where: { id: cred.id },
      data,
    });
  }
}

export async function runRetention() {
  const days = Number(process.env.CHECK_RETENTION_DAYS || 30);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const old = await prisma.checkResult.findMany({
    where: { checkedAt: { lt: cutoff } },
    select: {
      healthCheckId: true,
      status: true,
      latencyMs: true,
      checkedAt: true,
    },
  });

  const buckets = new Map<
    string,
    { ok: number; fail: number; latencySum: number; latencyN: number }
  >();

  for (const r of old) {
    const day = new Date(r.checkedAt);
    day.setUTCHours(0, 0, 0, 0);
    const key = `${r.healthCheckId}|${day.toISOString()}`;
    const b = buckets.get(key) || { ok: 0, fail: 0, latencySum: 0, latencyN: 0 };
    if (r.status === "ok") b.ok += 1;
    else b.fail += 1;
    if (r.latencyMs != null) {
      b.latencySum += r.latencyMs;
      b.latencyN += 1;
    }
    buckets.set(key, b);
  }

  for (const [key, b] of buckets) {
    const [healthCheckId, dayIso] = key.split("|");
    const total = b.ok + b.fail;
    await prisma.checkResultDaily.upsert({
      where: {
        healthCheckId_day: {
          healthCheckId: healthCheckId!,
          day: new Date(dayIso!),
        },
      },
      create: {
        healthCheckId: healthCheckId!,
        day: new Date(dayIso!),
        okCount: b.ok,
        failCount: b.fail,
        avgLatencyMs: b.latencyN ? b.latencySum / b.latencyN : null,
        uptimePct: total ? (b.ok / total) * 100 : null,
      },
      update: {
        okCount: { increment: b.ok },
        failCount: { increment: b.fail },
      },
    });
  }

  await prisma.checkResult.deleteMany({ where: { checkedAt: { lt: cutoff } } });
}
