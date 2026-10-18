import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireApiUser();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      projects,
      openIncidents,
      expiringCredentials,
      recentResults,
      incidents,
    ] = await Promise.all([
      prisma.project.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { services: true } },
          services: {
            select: {
              id: true,
              name: true,
              healthChecks: {
                select: {
                  id: true,
                  name: true,
                  lastStatus: true,
                  lastLatencyMs: true,
                },
              },
            },
          },
        },
      }),
      prisma.incident.count({ where: { status: "open" } }),
      prisma.credential.count({
        where: {
          expiresAt: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      prisma.checkResult.findMany({
        where: { checkedAt: { gte: since24h } },
        orderBy: { checkedAt: "asc" },
        select: {
          status: true,
          latencyMs: true,
          checkedAt: true,
          healthCheckId: true,
          healthCheck: { select: { name: true, serviceId: true } },
        },
        take: 2000,
      }),
      prisma.incident.findMany({
        where: { status: "open" },
        include: {
          project: { select: { name: true } },
          service: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
    ]);

    const uptimeByCheck = new Map<string, { ok: number; total: number }>();
    for (const r of recentResults) {
      const b = uptimeByCheck.get(r.healthCheckId) || { ok: 0, total: 0 };
      b.total += 1;
      if (r.status === "ok") b.ok += 1;
      uptimeByCheck.set(r.healthCheckId, b);
    }

    const latencySeries = recentResults
      .filter((r) => r.latencyMs != null)
      .slice(-200)
      .map((r) => ({
        t: r.checkedAt,
        ms: r.latencyMs,
        check: r.healthCheck.name,
      }));

    return jsonOk({
      projects,
      openIncidents,
      expiringCredentials,
      openIncidentList: incidents,
      uptime24h: Object.fromEntries(
        [...uptimeByCheck.entries()].map(([id, v]) => [
          id,
          v.total ? Math.round((v.ok / v.total) * 1000) / 10 : null,
        ]),
      ),
      latencySeries,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
