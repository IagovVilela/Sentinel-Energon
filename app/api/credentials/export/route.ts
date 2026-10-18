import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  AuthError,
  isReauthFresh,
  requireApiUser,
  requestMeta,
} from "@/lib/auth";
import { decryptSecret, encryptBackup } from "@/lib/crypto";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser(["owner"]);
    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { reauthAt: true },
    });
    if (!isReauthFresh({ ...user, reauthAt: fresh.reauthAt })) {
      throw new AuthError("Reautenticação necessária", 403);
    }

    const body = schema.parse(await req.json());
    const credentials = await prisma.credential.findMany({
      include: {
        service: {
          select: {
            name: true,
            project: { select: { name: true } },
          },
        },
      },
    });

    const payload = credentials.map((c) => ({
      project: c.service.project.name,
      service: c.service.name,
      type: c.type,
      label: c.label,
      username: c.username,
      secret: decryptSecret({
        ciphertext: c.ciphertext,
        dekEncrypted: c.dekEncrypted,
        iv: c.iv,
        authTag: c.authTag,
      }),
      expiresAt: c.expiresAt,
      notes: c.notes,
    }));

    const blob = encryptBackup(JSON.stringify(payload), body.password);
    const meta = await requestMeta();
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "export",
        ip: meta.ip,
        userAgent: meta.userAgent,
        detail: `Exportou ${payload.length} credenciais`,
      },
    });

    return jsonOk({ blob, count: payload.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  return jsonError("Use POST", 405);
}
