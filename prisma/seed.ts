import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_OWNER_EMAIL || "owner@energon.local").toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD || "ChangeMeOwner123!";
  const name = process.env.SEED_OWNER_NAME || "Dono Energon";

  const passwordHash = await hashPassword(password);

  // Migra owners antigos para o e-mail atual
  const previousOwners = await prisma.user.findMany({
    where: { role: "owner", NOT: { email } },
  });
  for (const prev of previousOwners) {
    await prisma.session.deleteMany({ where: { userId: prev.id } });
    await prisma.user.delete({ where: { id: prev.id } });
  }

  const existingOwner = await prisma.user.findUnique({ where: { email } });

  const owner = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: "owner",
    },
    create: {
      email,
      name,
      passwordHash,
      role: "owner",
      totpEnabled: false,
    },
  });

  // Só limpa sessões na criação da conta; não derruba 2FA a cada boot
  if (!existingOwner) {
    await prisma.session.deleteMany({ where: { userId: owner.id } });
  }

  const alertCount = await prisma.alertRule.count({
    where: { OR: [{ email }, { userId: owner.id }] },
  });
  if (alertCount === 0) {
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
  }

  // Remove dados de demonstração (não recria)
  const demos = await prisma.project.findMany({
    where: {
      OR: [
        { name: "Demo Commerce Energon" },
        { tags: { has: "demo" } },
        { statusPageSlug: "demo-commerce" },
      ],
    },
    select: { id: true, name: true },
  });

  for (const demo of demos) {
    await prisma.project.delete({ where: { id: demo.id } });
    console.log(`Demo removido: ${demo.name}`);
  }

  console.log("Seed OK");
  console.log(`Owner: ${email}`);
  if (demos.length === 0) {
    console.log("Nenhum demo para remover.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
