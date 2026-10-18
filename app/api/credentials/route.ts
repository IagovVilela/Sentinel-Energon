import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, requestMeta } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { credentialSchema, emptyToNull } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireApiUser();
    const serviceId = req.nextUrl.searchParams.get("serviceId");
    const expiring = req.nextUrl.searchParams.get("expiring");

    const credentials = await prisma.credential.findMany({
      where: {
        ...(serviceId ? { serviceId } : {}),
        ...(expiring === "1"
          ? {
              expiresAt: {
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                gte: new Date(),
              },
            }
          : {}),
      },
      select: {
        id: true,
        type: true,
        label: true,
        username: true,
        expiresAt: true,
        notes: true,
        createdAt: true,
        service: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { expiresAt: "asc" },
    });
    return jsonOk({ credentials });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser(["owner", "admin"]);
    const body = credentialSchema.parse(await req.json());
    const enc = encryptSecret(body.secret);
    const credential = await prisma.credential.create({
      data: {
        serviceId: body.serviceId,
        type: body.type,
        label: body.label,
        username: body.username ?? null,
        ciphertext: enc.ciphertext,
        dekEncrypted: enc.dekEncrypted,
        iv: enc.iv,
        authTag: enc.authTag,
        expiresAt: emptyToNull(body.expiresAt)
          ? new Date(body.expiresAt as string)
          : null,
        notes: body.notes ?? null,
      },
    });

    const meta = await requestMeta();
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        action: "create",
        ip: meta.ip,
        userAgent: meta.userAgent,
        detail: `Criou credencial ${credential.label}`,
      },
    });

    return jsonOk(
      {
        credential: {
          id: credential.id,
          type: credential.type,
          label: credential.label,
          username: credential.username,
          expiresAt: credential.expiresAt,
        },
      },
      201,
    );
  } catch (err) {
    return handleApiError(err);
  }
}
