import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CredentialActions } from "@/components/credentials/credential-actions";
import { CredentialEditActions } from "@/components/credentials/credential-edit-actions";
import { CredentialForm } from "@/components/credentials/credential-form";
import { ImportExport } from "@/components/credentials/import-export";

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string; highlight?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const canEdit = user.role === "owner" || user.role === "admin";

  const credentials = await prisma.credential.findMany({
    where: sp.serviceId ? { serviceId: sp.serviceId } : undefined,
    orderBy: [{ expiresAt: "asc" }, { label: "asc" }],
    select: {
      id: true,
      type: true,
      label: true,
      username: true,
      expiresAt: true,
      notes: true,
      createdAt: true,
      service: {
        select: {
          id: true,
          name: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      project: { select: { name: true } },
    },
  });

  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cofre de credenciais</h1>
          <p className="text-sm text-muted">
            Valores ocultos por padrão. Revelar exige reautenticação recente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <CredentialForm services={services} defaultServiceId={sp.serviceId} />}
          {user.role === "owner" && <ImportExport />}
        </div>
      </div>

      <div className="grid gap-3">
        {credentials.map((c) => {
          const days =
            c.expiresAt != null
              ? Math.ceil((c.expiresAt.getTime() - now) / (1000 * 60 * 60 * 24))
              : null;
          const highlight = sp.highlight === c.id;
          return (
            <Card
              key={c.id}
              className={highlight ? "border-accent-cyan/60" : undefined}
            >
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{c.label}</CardTitle>
                  <p className="text-xs text-muted mt-1">
                    {c.service.project.name} · {c.service.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge>{c.type}</Badge>
                    {c.username && <Badge>{c.username}</Badge>}
                    {days != null && (
                      <Badge
                        className={
                          days <= 7
                            ? "text-down"
                            : days <= 30
                              ? "text-degraded"
                              : ""
                        }
                      >
                        expira em {days}d
                      </Badge>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex flex-col items-end gap-2">
                    <CredentialActions credentialId={c.id} />
                    <CredentialEditActions
                      credential={{
                        id: c.id,
                        label: c.label,
                        username: c.username,
                        expiresAt: c.expiresAt,
                        notes: c.notes,
                      }}
                    />
                  </div>
                )}
              </CardHeader>
              {c.notes && (
                <CardContent>
                  <p className="text-sm text-muted">{c.notes}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
        {credentials.length === 0 && (
          <p className="text-sm text-muted">Nenhuma credencial cadastrada.</p>
        )}
      </div>
    </div>
  );
}
