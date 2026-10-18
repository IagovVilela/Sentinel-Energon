import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  AuthError,
  isReauthFresh,
  requireApiUser,
  requestMeta,
} from "@/lib/auth";
import { decryptBackup, encryptSecret } from "@/lib/crypto";
import { handleApiError, jsonOk } from "@/lib/api";
import { z } from "zod";

const itemSchema = z.object({
  project: z.string(),
  service: z.string(),
  type: z.enum([
    "login",
    "api_key",
    "token",
    "secret",
    "connection_string",
    "other",
  ]),
  label: z.string(),
  username: z.string().optional().nullable(),
  secret: z.string(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const schema = z.object({
  password: z.string().optional(),
  blob: z.string().optional(),
  items: z.array(itemSchema).optional(),
  csv: z.string().optional(),
});

function parseCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift()?.split(",") ?? [];
  return lines.map((line) => {
    const cols = line.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h.trim()] = (cols[i] || "").trim();
    });
    return {
      project: row.project || row.sistema || "",
      service: row.service || row.servico || "",
      type: (row.type || "other") as z.infer<typeof itemSchema>["type"],
      label: row.label || row.rotulo || "",
      username: row.username || null,
      secret: row.secret || row.valor || "",
      expiresAt: row.expiresAt || null,
      notes: row.notes || null,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser(["owner", "admin"]);
    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { reauthAt: true },
    });
    if (!isReauthFresh({ ...user, reauthAt: fresh.reauthAt })) {
      throw new AuthError("Reautenticação necessária", 403);
    }

    const body = schema.parse(await req.json());
    let items: z.infer<typeof itemSchema>[] = [];

    if (body.blob && body.password) {
      const json = decryptBackup(body.blob, body.password);
      items = z.array(itemSchema).parse(JSON.parse(json));
    } else if (body.csv) {
      items = z.array(itemSchema).parse(parseCsv(body.csv));
    } else if (body.items) {
      items = body.items;
    } else {
      throw new Error("Informe items, csv ou blob+password");
    }

    let imported = 0;
    for (const item of items) {
      const project = await prisma.project.findFirst({
        where: { name: item.project },
      });
      if (!project) continue;
      const service = await prisma.service.findFirst({
        where: { projectId: project.id, name: item.service },
      });
      if (!service) continue;

      const enc = encryptSecret(item.secret);
      await prisma.credential.create({
        data: {
          serviceId: service.id,
          type: item.type,
          label: item.label,
          username: item.username ?? null,
          ciphertext: enc.ciphertext,
          dekEncrypted: enc.dekEncrypted,
          iv: enc.iv,
          authTag: enc.authTag,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          notes: item.notes ?? null,
        },
      });
      imported++;
    }

    const meta = await requestMeta();
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "import",
        ip: meta.ip,
        userAgent: meta.userAgent,
        detail: `Importou ${imported} credenciais`,
      },
    });

    return jsonOk({ imported });
  } catch (err) {
    return handleApiError(err);
  }
}
