import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

export async function checkLoginRateLimit(
  email: string,
  ip: string,
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email: email.toLowerCase(), success: false, createdAt: { gte: since } },
    }),
    prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: since } },
    }),
  ]);

  if (byEmail >= MAX_ATTEMPTS || byIp >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil(WINDOW_MS / 1000) };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(
  email: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase(), ip, success },
  });
}

export async function isUserLocked(
  lockedUntil: Date | null,
): Promise<boolean> {
  if (!lockedUntil) return false;
  return lockedUntil > new Date();
}

export async function bumpFailedLogins(userId: string): Promise<void> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: { increment: 1 } },
  });

  if (user.failedLogins >= MAX_ATTEMPTS) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_MINUTES);
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil, failedLogins: 0 },
    });
  }
}

export async function clearFailedLogins(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: 0, lockedUntil: null },
  });
}
