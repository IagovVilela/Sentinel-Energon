import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StatusDot } from "@/components/status-dot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LatencyChart } from "@/components/dashboard/latency-chart";
import { formatDuration } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [projects, openIncidents, expiringCredentials, recentResults, incidents] =
    await Promise.all([
      prisma.project.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { services: true } } },
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
        take: 300,
        include: { healthCheck: { select: { name: true } } },
      }),
      prisma.incident.findMany({
        where: { status: "open" },
        include: {
          project: { select: { id: true, name: true } },
          service: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
    ]);

  const ok = recentResults.filter((r) => r.status === "ok").length;
  const uptimePct = recentResults.length
    ? Math.round((ok / recentResults.length) * 1000) / 10
    : null;

  const latencySeries = recentResults
    .filter((r) => r.latencyMs != null)
    .map((r) => ({
      t: r.checkedAt.toISOString(),
      ms: r.latencyMs as number,
      check: r.healthCheck.name,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Visão geral dos sistemas Energon</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-down/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted">Incidentes abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-down">{openIncidents}</p>
          </CardContent>
        </Card>
        <Card className="border-degraded/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted">
              Credenciais expirando (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-degraded">
              {expiringCredentials}
            </p>
          </CardContent>
        </Card>
        <Card className="border-online/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted">Uptime 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-online">
              {uptimePct != null ? `${uptimePct}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
            Sistemas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:border-accent-indigo/50 transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{p.name}</CardTitle>
                      <StatusDot status={p.status} label={false} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <StatusDot status={p.status} />
                    <div className="flex flex-wrap gap-1">
                      <Badge>{p.environment}</Badge>
                      <Badge>{p._count.services} serviços</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted">
                Nenhum sistema ainda.{" "}
                <Link href="/projects" className="text-accent-cyan underline">
                  Cadastrar
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
            Latência (24h)
          </h2>
          <Card>
            <CardContent className="pt-4">
              <LatencyChart data={latencySeries} />
            </CardContent>
          </Card>

          <h2 className="text-sm font-medium text-muted uppercase tracking-wide pt-2">
            Incidentes abertos
          </h2>
          <Card>
            <CardContent className="pt-4 space-y-3">
              {incidents.length === 0 && (
                <p className="text-sm text-muted">Nenhum incidente aberto.</p>
              )}
              {incidents.map((i) => (
                <Link
                  key={i.id}
                  href={`/projects/${i.project.id}`}
                  className="block rounded-md border border-card-border p-3 hover:bg-white/5"
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {i.project.name} · {i.service.name}
                      </p>
                      <p className="text-xs text-muted">{i.cause}</p>
                    </div>
                    <span className="text-xs text-down">
                      {formatDuration(Date.now() - i.startedAt.getTime())}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
