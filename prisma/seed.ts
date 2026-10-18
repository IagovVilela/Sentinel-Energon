import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { encryptSecret } from "../lib/crypto";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_OWNER_EMAIL || "owner@energon.local").toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD || "ChangeMeOwner123!";
  const name = process.env.SEED_OWNER_NAME || "Dono Energon";

  if (!process.env.MASTER_KEY) {
    throw new Error("MASTER_KEY é obrigatória para o seed (credenciais criptografadas)");
  }

  const passwordHash = await hashPassword(password);

  // Migra owners antigos (ex.: owner@energon.local) para o e-mail atual
  const previousOwners = await prisma.user.findMany({
    where: { role: "owner", NOT: { email } },
  });
  for (const prev of previousOwners) {
    await prisma.session.deleteMany({ where: { userId: prev.id } });
    await prisma.user.delete({ where: { id: prev.id } });
  }

  const owner = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: "owner",
      totpEnabled: false,
      totpSecret: null,
      failedLogins: 0,
      lockedUntil: null,
      reauthAt: null,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "owner",
      totpEnabled: false,
    },
  });

  await prisma.session.deleteMany({ where: { userId: owner.id } });

  await prisma.alertRule.deleteMany({
    where: { OR: [{ email }, { userId: owner.id }] },
  });
  await prisma.alertRule.create({
    data: {
      userId: owner.id,
      email,
      notifyDown: true,
      notifyRecovery: true,
      notifyExpiry: true,
      reminderHours: 4,
    },
  });

  // Clean demo project if re-seeding
  const existing = await prisma.project.findFirst({
    where: { name: "Demo Commerce Energon" },
  });
  if (existing) {
    await prisma.project.delete({ where: { id: existing.id } });
  }

  const project = await prisma.project.create({
    data: {
      name: "Demo Commerce Energon",
      description:
        "Sistema de demonstração com front, back, banco, pagamentos, e-mail, Meta e WhatsApp.",
      environment: "production",
      status: "unknown",
      publicUrl: "https://demo.energon.example",
      tags: ["demo", "ecommerce"],
      statusPageEnabled: true,
      statusPageSlug: "demo-commerce",
    },
  });

  const services = [
    {
      name: "Storefront",
      category: "frontend" as const,
      provider: "Vercel",
      adminUrl: "https://vercel.com/dashboard",
      hostingUrl: "https://vercel.com/dashboard",
      gitUrl: "https://github.com/energon/demo-storefront",
      checks: [
        {
          name: "Home",
          type: "http" as const,
          url: "https://example.com",
          expectedStatus: 200,
        },
      ],
      creds: [
        {
          type: "token" as const,
          label: "Vercel Deploy Token",
          secret: "vercel_demo_token_not_real",
        },
      ],
    },
    {
      name: "API",
      category: "backend" as const,
      provider: "Railway",
      adminUrl: "https://railway.app/dashboard",
      hostingUrl: "https://railway.app/dashboard",
      gitUrl: "https://github.com/energon/demo-api",
      checks: [
        {
          name: "/health",
          type: "http" as const,
          url: "https://example.com",
          expectedStatus: 200,
        },
        {
          name: "/api/login",
          type: "http" as const,
          url: "https://example.com",
          expectedStatus: 200,
        },
      ],
      creds: [
        {
          type: "secret" as const,
          label: "JWT_SECRET",
          secret: "demo-jwt-secret-value",
        },
      ],
    },
    {
      name: "Postgres",
      category: "database" as const,
      provider: "Neon",
      adminUrl: "https://console.neon.tech",
      hostingUrl: "https://console.neon.tech",
      gitUrl: null,
      checks: [
        {
          name: "DB via /health",
          type: "http" as const,
          url: "https://example.com",
          expectedStatus: 200,
        },
      ],
      creds: [
        {
          type: "connection_string" as const,
          label: "DATABASE_URL",
          secret: "postgresql://demo:demo@localhost:5432/demo",
        },
      ],
    },
    {
      name: "Asaas",
      category: "payment" as const,
      provider: "Asaas",
      adminUrl: "https://www.asaas.com/",
      hostingUrl: null,
      gitUrl: null,
      checks: [],
      creds: [
        {
          type: "api_key" as const,
          label: "ASAAS_API_KEY",
          secret: "asaas_demo_key",
          expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      name: "Resend",
      category: "email" as const,
      provider: "Resend",
      adminUrl: "https://resend.com/emails",
      hostingUrl: null,
      gitUrl: null,
      checks: [],
      creds: [
        {
          type: "api_key" as const,
          label: "RESEND_API_KEY",
          secret: "re_demo_key",
        },
      ],
    },
    {
      name: "Meta App",
      category: "meta" as const,
      provider: "Meta",
      adminUrl: "https://developers.facebook.com/apps/",
      hostingUrl: null,
      gitUrl: null,
      checks: [],
      creds: [
        {
          type: "token" as const,
          label: "Meta Long-Lived Token",
          secret: "meta_demo_long_lived_token",
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      name: "WhatsApp Business",
      category: "whatsapp" as const,
      provider: "Meta WhatsApp Cloud API",
      adminUrl: "https://business.facebook.com/",
      hostingUrl: null,
      gitUrl: null,
      checks: [
        {
          name: "/webhook",
          type: "http" as const,
          url: "https://example.com",
          expectedStatus: 200,
        },
      ],
      creds: [
        {
          type: "token" as const,
          label: "WhatsApp Access Token",
          secret: "wa_demo_token",
          expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        },
      ],
    },
  ];

  for (const s of services) {
    const service = await prisma.service.create({
      data: {
        projectId: project.id,
        name: s.name,
        category: s.category,
        provider: s.provider,
        adminUrl: s.adminUrl,
        hostingUrl: s.hostingUrl,
        gitUrl: s.gitUrl,
      },
    });

    for (const c of s.checks) {
      await prisma.healthCheck.create({
        data: {
          serviceId: service.id,
          name: c.name,
          type: c.type,
          url: c.url,
          expectedStatus: c.expectedStatus,
          intervalSec: 60,
          failureThreshold: 2,
        },
      });
    }

    for (const cred of s.creds) {
      const enc = encryptSecret(cred.secret);
      await prisma.credential.create({
        data: {
          serviceId: service.id,
          type: cred.type,
          label: cred.label,
          ciphertext: enc.ciphertext,
          dekEncrypted: enc.dekEncrypted,
          iv: enc.iv,
          authTag: enc.authTag,
          expiresAt: "expiresAt" in cred ? cred.expiresAt : null,
        },
      });
    }
  }

  console.log("Seed OK");
  console.log(`Owner: ${email}`);
  console.log(`Senha: ${password}`);
  console.log("Configure o 2FA no primeiro login (obrigatório para owner).");
  console.log(`Status page: /status/demo-commerce`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
