import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/crypto";
import { getClientIp } from "@/lib/utils";

export const SESSION_COOKIE = "energon_session";
const SESSION_DAYS = 14;
const REAUTH_MINUTES = 5;

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "totpEnabled" | "reauthAt"
>;

function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
}

export async function createSession(
  userId: string,
  meta?: { ip?: string; userAgent?: string | null },
): Promise<string> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ip: meta?.ip,
      userAgent: meta?.userAgent ?? undefined,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          totpEnabled: true,
          reauthAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session.user;
}

export async function requireUser(
  roles?: UserRole[],
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireApiUser(
  roles?: UserRole[],
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Não autenticado", 401);
  }
  if (roles && !roles.includes(user.role)) {
    throw new AuthError("Sem permissão", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function isReauthFresh(user: SessionUser): boolean {
  if (!user.reauthAt) return false;
  const deadline = new Date(user.reauthAt);
  deadline.setMinutes(deadline.getMinutes() + REAUTH_MINUTES);
  return deadline > new Date();
}

export async function markReauth(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { reauthAt: new Date() },
  });
}

export async function requestMeta(): Promise<{
  ip: string;
  userAgent: string | null;
}> {
  const h = await headers();
  return {
    ip: getClientIp(h),
    userAgent: h.get("user-agent"),
  };
}

export { REAUTH_MINUTES };
