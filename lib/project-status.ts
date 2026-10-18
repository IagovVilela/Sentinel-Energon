import type { CheckResultStatus, ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export function aggregateStatus(
  statuses: Array<CheckResultStatus | null | undefined>,
): ProjectStatus {
  const known = statuses.filter((s): s is CheckResultStatus => s != null);
  if (known.length === 0) return "unknown";
  if (known.some((s) => s === "fail")) return "down";
  return "operational";
}

/** Recalculate project status from latest health checks of its services. */
export async function refreshProjectStatus(projectId: string): Promise<ProjectStatus> {
  const checks = await prisma.healthCheck.findMany({
    where: { service: { projectId }, enabled: true },
    select: { lastStatus: true },
  });

  // Degraded if any open incident? Prefer fail → down; else if mix of ok and unknown → degraded
  const openIncidents = await prisma.incident.count({
    where: { projectId, status: "open" },
  });

  let status = aggregateStatus(checks.map((c) => c.lastStatus));
  if (status === "operational" && openIncidents > 0) {
    status = "degraded";
  }
  if (status === "unknown" && openIncidents > 0) {
    status = "down";
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  return status;
}
