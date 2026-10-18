import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusDot } from "@/components/status-dot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findFirst({
    where: { statusPageSlug: slug, statusPageEnabled: true },
    include: {
      services: {
        select: {
          id: true,
          name: true,
          category: true,
          healthChecks: {
            where: { enabled: true },
            select: {
              name: true,
              lastStatus: true,
              lastCheckedAt: true,
            },
          },
        },
      },
      incidents: {
        where: { status: "open" },
        select: {
          id: true,
          cause: true,
          startedAt: true,
          service: { select: { name: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2 pt-8">
        <p className="text-xs uppercase tracking-widest text-muted">
          Status público
        </p>
        <h1 className="text-3xl font-semibold gradient-text">{project.name}</h1>
        <StatusDot status={project.status} />
      </div>

      {project.incidents.length > 0 && (
        <Card className="border-down/40">
          <CardHeader>
            <CardTitle>Incidentes em andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.incidents.map((i) => (
              <p key={i.id} className="text-sm">
                <Badge className="text-down mr-2">{i.service.name}</Badge>
                {i.cause}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {project.services.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {s.healthChecks.length === 0 && (
                <p className="text-sm text-muted">Sem checks públicos.</p>
              )}
              {s.healthChecks.map((hc, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{hc.name}</span>
                  <StatusDot
                    status={
                      hc.lastStatus === "ok"
                        ? "operational"
                        : hc.lastStatus === "fail"
                          ? "down"
                          : "unknown"
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted pb-8">
        Powered by Energon Sentinel — sem exposição de URLs internas ou credenciais.
      </p>
    </main>
  );
}
