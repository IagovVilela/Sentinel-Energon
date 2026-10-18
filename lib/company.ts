import { prisma } from "@/lib/db";

const DEFAULTS = {
  name: "Energon",
  tagline: "Soluções digitais para o seu negócio",
  phone: "+55 12 98700-2929",
  whatsapp: "+55 12 98700-2929",
  instagram: "@energontech",
  websiteUrl: "https://energon.up.railway.app/",
  subscriptionUrl: "https://assinates-energon-production.up.railway.app",
} as const;

export async function ensureCompanyProfile(
  userId: string,
  email?: string | null,
) {
  return prisma.companyProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULTS,
      email: email || null,
    },
    update: {},
  });
}

/** Digits only for wa.me links */
export function whatsappDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

export function instagramHandle(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/^@/, "").trim() || null;
}

export function instagramUrl(value: string | null | undefined): string | null {
  const handle = instagramHandle(value);
  return handle ? `https://instagram.com/${handle}` : null;
}

export function whatsappUrl(value: string | null | undefined): string | null {
  const digits = whatsappDigits(value);
  return digits ? `https://wa.me/${digits}` : null;
}
