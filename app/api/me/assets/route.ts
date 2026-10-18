import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personalAssetKindSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  PHOTO_MAX_BYTES,
  PHOTO_MIME,
  RESUME_MAX_BYTES,
  RESUME_MIME,
} from "@/lib/me";

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const form = await req.formData();
    const kindRaw = String(form.get("kind") || "");
    const kind = personalAssetKindSchema.parse(kindRaw);
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("Arquivo obrigatório", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const filename = file.name || (kind === "photo" ? "foto.jpg" : "curriculo.pdf");

    if (kind === "photo") {
      if (!PHOTO_MIME.has(mimeType)) {
        return jsonError("Foto: use JPEG, PNG, WebP ou GIF", 400);
      }
      if (buffer.length > PHOTO_MAX_BYTES) {
        return jsonError("Foto deve ter no máximo 2 MB", 400);
      }
    } else {
      if (!RESUME_MIME.has(mimeType)) {
        return jsonError("Currículo: use PDF ou Word", 400);
      }
      if (buffer.length > RESUME_MAX_BYTES) {
        return jsonError("Currículo deve ter no máximo 5 MB", 400);
      }
    }

    const asset = await prisma.personalAsset.upsert({
      where: {
        userId_kind: { userId: user.id, kind },
      },
      create: {
        userId: user.id,
        kind,
        filename,
        mimeType,
        data: buffer,
      },
      update: {
        filename,
        mimeType,
        data: buffer,
      },
      select: {
        id: true,
        kind: true,
        filename: true,
        mimeType: true,
        updatedAt: true,
      },
    });

    return jsonOk({ asset }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
