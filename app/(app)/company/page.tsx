import { requireUser } from "@/lib/auth";
import { ensureCompanyProfile } from "@/lib/company";
import { CompanyHub } from "@/components/company/company-hub";

export default async function CompanyPage() {
  const user = await requireUser();
  const company = await ensureCompanyProfile(user.id, user.email);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Empresa</h1>
        <p className="text-sm text-muted">
          Contatos, site e assinatura da Energon — prontos para copiar e abrir.
        </p>
      </div>
      <CompanyHub
        initial={{
          name: company.name,
          tagline: company.tagline,
          email: company.email,
          phone: company.phone,
          whatsapp: company.whatsapp,
          instagram: company.instagram,
          websiteUrl: company.websiteUrl,
          subscriptionUrl: company.subscriptionUrl,
        }}
      />
    </div>
  );
}
