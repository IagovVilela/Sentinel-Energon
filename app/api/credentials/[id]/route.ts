import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, requestMeta } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  username: z.string().max(320).optional().nullable(),
  secret: z.string().min(1).optional(),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  notes: z.string().max(5000).optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    const body = updateSchema.parse(await req.json());

    const data: Record<string, unknown> = {};
    if (body.label != null) data.label = body.label;
    if (body.username !== undefined) data.username = body.username;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      data.expiryNotified30 = false;
      data.expiryNotified7 = false;
      data.expiryNotified1 = false;
    }
    if (body.secret) {
      const enc = encryptSecret(body.secret);
      Object.assign(data, {
        ciphertext: enc.ciphertext,
        dekEncrypted: enc.dekEncrypted,
        iv: enc.iv,
        authTag: enc.authTag,
      });
    }

    const credential = await prisma.credential.update({
      where: { id },
      data,
      select: {
        id: true,
        label: true,
        type: true,
        username: true,
        expiresAt: true,
        notes: true,
      },
    });

    const meta = await requestMeta();
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        action: "update",
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return jsonOk({ credential });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    const exists = await prisma.credential.findUnique({ where: { id } });
    if (!exists) return jsonError("Não encontrada", 404);

    const meta = await requestMeta();
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        credentialId: id,
        action: "delete",
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    await prisma.credential.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
