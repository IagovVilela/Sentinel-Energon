import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORY_LABELS, formatDuration } from "@/lib/utils";
import { StatusDot } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceForm } from "@/components/projects/service-form";
import { ProjectEditActions } from "@/components/projects/project-edit-actions";
import { ServiceHubCard } from "@/components/projects/service-hub-card";

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
          credentials: {
            orderBy: [{ expiresAt: "asc" }, { label: "asc" }],
            select: {
              id: true,
              type: true,
              label: true,
              username: true,
              expiresAt: true,
              notes: true,
            },
          },
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
  const byCategory = project.services.reduce<
    Record<string, typeof project.services>
  >((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
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
                className="text-xs text-accent-cyan underline break-all"
              >
                {project.publicUrl}
              </a>
            )}
            {project.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted mt-3 max-w-xl">
            Tudo deste sistema fica nesta página: links, credenciais e
            monitoramento de cada serviço. Não é preciso abrir outras abas.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <ServiceForm projectId={project.id} />
            <ProjectEditActions
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                publicUrl: project.publicUrl,
                environment: project.environment,
                statusPageEnabled: project.statusPageEnabled,
                statusPageSlug: project.statusPageSlug,
              }}
            />
          </div>
        )}
      </div>

      {project.services.length === 0 && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm font-medium">Nenhum serviço ainda</p>
            <p className="text-sm text-muted">
              Clique em <strong>Novo serviço</strong> e cadastre, por exemplo,
              Front-end ou API. Nele você coloca Git, hospedagem, credenciais e
              o health check.
            </p>
          </CardContent>
        </Card>
      )}

      {Object.entries(byCategory).map(([category, services]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <ServiceHubCard
                key={service.id}
                projectName={project.name}
                canEdit={canEdit}
                service={service}
              />
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
