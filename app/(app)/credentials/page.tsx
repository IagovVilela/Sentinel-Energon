import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CredentialForm } from "@/components/credentials/credential-form";
import { ImportExport } from "@/components/credentials/import-export";
import { CredentialsVaultPanel } from "@/components/credentials/credentials-vault-panel";

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
          category: true,
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
          {canEdit && (
            <CredentialForm
              services={services}
              defaultServiceId={sp.serviceId}
            />
          )}
          {user.role === "owner" && <ImportExport />}
        </div>
      </div>

      {credentials.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma credencial cadastrada.</p>
      ) : (
        <CredentialsVaultPanel
          credentials={credentials}
          canEdit={canEdit}
          highlightId={sp.highlight}
        />
      )}
    </div>
  );
}
