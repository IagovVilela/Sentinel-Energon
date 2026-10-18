import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StatusDot } from "@/components/status-dot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/projects/project-form";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { services: true } } },
  });
  const canEdit = user.role === "owner" || user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sistemas</h1>
          <p className="text-sm text-muted">
            Todos os sistemas e ambientes da Energon
          </p>
        </div>
        {canEdit && <ProjectForm />}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="h-full hover:border-accent-cyan/40 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle>{p.name}</CardTitle>
                  <StatusDot status={p.status} label={false} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatusDot status={p.status} />
                <p className="text-sm text-muted line-clamp-2">
                  {p.description || "Sem descrição"}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge>{p.environment}</Badge>
                  <Badge>{p._count.services} serviços</Badge>
                  {p.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
