import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  AuthError,
  isReauthFresh,
  requireApiUser,
  requestMeta,
} from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireApiUser(["owner", "admin"]);
    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { reauthAt: true },
    });
    if (!isReauthFresh({ ...user, reauthAt: fresh.reauthAt })) {
      throw new AuthError("Reautenticação necessária", 403);
    }

    const { id } = await ctx.params;
    const credential = await prisma.credential.findUnique({ where: { id } });
    if (!credential) return jsonError("Credencial não encontrada", 404);

    const secret = decryptSecret({
      ciphertext: credential.ciphertext,
      dekEncrypted: credential.dekEncrypted,
      iv: credential.iv,
      authTag: credential.authTag,
    });

    const body = await req.json().catch(() => ({}));
    const action = body.action === "copy" ? "copy" : "reveal";
    const meta = await requestMeta();

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        action,
        ip: meta.ip,
        userAgent: meta.userAgent,
        detail: `${action} credencial ${credential.label}`,
      },
    });

    return jsonOk({
      secret,
      username: credential.username,
      label: credential.label,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
