import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import { verifyTotp } from "@/lib/totp";
import { createSession, requestMeta } from "@/lib/auth";
import {
  bumpFailedLogins,
  checkLoginRateLimit,
  clearFailedLogins,
  isUserLocked,
  recordLoginAttempt,
} from "@/lib/rate-limit";
import { assertIpAllowed, handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    assertIpAllowed(req.headers);
    const body = loginSchema.parse(await req.json());
    const meta = await requestMeta();

    const rate = await checkLoginRateLimit(body.email, meta.ip);
    if (!rate.allowed) {
      return jsonError(
        `Muitas tentativas. Tente novamente em ${rate.retryAfterSec}s.`,
        429,
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      await recordLoginAttempt(body.email, meta.ip, false);
      return jsonError("Credenciais inválidas", 401);
    }

    if (await isUserLocked(user.lockedUntil)) {
      return jsonError("Conta temporariamente bloqueada. Tente mais tarde.", 423);
    }

    const valid = await verifyPassword(user.passwordHash, body.password);
    if (!valid) {
      await recordLoginAttempt(body.email, meta.ip, false);
      await bumpFailedLogins(user.id);
      return jsonError("Credenciais inválidas", 401);
    }

    const needsTotp =
      user.totpEnabled || user.role === "owner";

    if (needsTotp) {
      if (!user.totpEnabled || !user.totpSecret) {
        await clearFailedLogins(user.id);
        await recordLoginAttempt(body.email, meta.ip, true);
        const token = await createSession(user.id, meta);
        return jsonOk({
          requiresTotpSetup: true,
          user: { id: user.id, email: user.email, role: user.role },
          session: Boolean(token),
        });
      }

      if (!body.totp || !(await verifyTotp(user.totpSecret, body.totp))) {
        await recordLoginAttempt(body.email, meta.ip, false);
        await bumpFailedLogins(user.id);
        return jsonError("Código 2FA inválido", 401);
      }
    }

    await clearFailedLogins(user.id);
    await recordLoginAttempt(body.email, meta.ip, true);
    await createSession(user.id, meta);

    return jsonOk({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        totpEnabled: user.totpEnabled,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
