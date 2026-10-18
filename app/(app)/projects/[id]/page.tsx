import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, GitBranch, Server } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORY_LABELS, formatDuration } from "@/lib/utils";
import { StatusDot } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceForm } from "@/components/projects/service-form";
import { RunCheckButton } from "@/components/projects/run-check-button";
import { HealthCheckForm } from "@/components/projects/health-check-form";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      services: {
        orderBy: [{ category: "asc" }, { name: "asc" }],
        include: {
          healthChecks: { orderBy: { name: "asc" } },
          _count: { select: { credentials: true } },
        },
      },
      incidents: {
        orderBy: { startedAt: "desc" },
        take: 15,
        include: { service: { select: { name: true } } },
      },
    },
  });
  if (!project) notFound();

  const canEdit = user.role === "owner" || user.role === "admin";
  const byCategory = project.services.reduce<Record<string, typeof project.services>>(
    (acc, s) => {
      (acc[s.category] ||= []).push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <StatusDot status={project.status} />
          </div>
          <p className="text-sm text-muted">{project.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge>{project.environment}</Badge>
            {project.publicUrl && (
              <a
                href={project.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-cyan underline"
              >
                {project.publicUrl}
              </a>
            )}
            {project.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
        {canEdit && <ServiceForm projectId={project.id} />}
      </div>

      {Object.entries(byCategory).map(([category, services]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="grid gap-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {service.name}
                      {service.provider && (
                        <Badge>{service.provider}</Badge>
                      )}
                    </CardTitle>
                    {service.notes && (
                      <p className="text-xs text-muted mt-1">{service.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {service.adminUrl && (
                      <Button asChild size="sm" variant="secondary">
                        <a href={service.adminUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir painel
                        </a>
                      </Button>
                    )}
                    {service.hostingUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={service.hostingUrl} target="_blank" rel="noreferrer">
                          <Server className="h-3.5 w-3.5" />
                          Hospedagem
                        </a>
                      </Button>
                    )}
                    {service.gitUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={service.gitUrl} target="_blank" rel="noreferrer">
                          <GitBranch className="h-3.5 w-3.5" />
                          Git
                        </a>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/credentials?serviceId=${service.id}`}>
                        Ver credenciais ({service._count.credentials})
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.healthChecks.length === 0 ? (
                    <p className="text-xs text-muted">Nenhum health check.</p>
                  ) : (
                    <ul className="space-y-2">
                      {service.healthChecks.map((hc) => (
                        <li
                          key={hc.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-card-border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <StatusDot
                              status={hc.lastStatus === "fail" ? "down" : hc.lastStatus === "ok" ? "operational" : "unknown"}
                              label={false}
                            />
                            <span>{hc.name}</span>
                            <Badge>{hc.type}</Badge>
                            {hc.lastLatencyMs != null && (
                              <span className="text-xs text-muted">
                                {hc.lastLatencyMs}ms
                              </span>
                            )}
                          </div>
                          {canEdit && <RunCheckButton checkId={hc.id} />}
                        </li>
                      ))}
                    </ul>
                  )}
                  {canEdit && <HealthCheckForm serviceId={service.id} />}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
          Histórico de incidentes
        </h2>
        <Card>
          <CardContent className="pt-4 space-y-2">
            {project.incidents.length === 0 && (
              <p className="text-sm text-muted">Nenhum incidente registrado.</p>
            )}
            {project.incidents.map((i) => (
              <div
                key={i.id}
                className="flex justify-between gap-3 border-b border-card-border last:border-0 py-2 text-sm"
              >
                <div>
                  <p>
                    {i.service.name}{" "}
                    <Badge
                      className={
                        i.status === "open" ? "text-down" : "text-online"
                      }
                    >
                      {i.status === "open" ? "aberto" : "resolvido"}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted">{i.cause}</p>
                </div>
                <div className="text-xs text-muted text-right">
                  <div>{i.startedAt.toLocaleString("pt-BR")}</div>
                  <div>
                    {i.durationMs != null
                      ? formatDuration(i.durationMs)
                      : formatDuration(Date.now() - i.startedAt.getTime())}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
