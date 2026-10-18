import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensurePersonalProfile } from "@/lib/me";
import { MeHub } from "@/components/me/me-hub";

export default async function MePage() {
  const user = await requireUser();
  const profile = await ensurePersonalProfile(user.id, {
    fullName: user.name || "Iago Vilela Ventura",
    email: user.email,
  });

  const [links, snippets, assets] = await Promise.all([
    prisma.personalLink.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, url: true },
    }),
    prisma.personalSnippet.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, body: true },
    }),
    prisma.personalAsset.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        kind: true,
        filename: true,
        mimeType: true,
        updatedAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="text-sm text-muted">
          Links, currículo, foto e textos prontos para copiar — tudo nesta
          página.
        </p>
      </div>
      <MeHub
        initialProfile={{
          fullName: profile.fullName,
          email: profile.email,
          linkedinUrl: profile.linkedinUrl,
          companyUrl: profile.companyUrl,
          headline: profile.headline,
        }}
        initialLinks={links}
        initialSnippets={snippets}
        initialAssets={assets}
      />
    </div>
  );
}
