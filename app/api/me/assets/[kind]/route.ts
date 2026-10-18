import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personalAssetKindSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    const user = await requireApiUser();
    const { kind: kindRaw } = await params;
    const kind = personalAssetKindSchema.parse(kindRaw);
    const asset = await prisma.personalAsset.findUnique({
      where: { userId_kind: { userId: user.id, kind } },
    });
    if (!asset) return jsonError("Arquivo não encontrado", 404);

    const disposition =
      kind === "photo"
        ? `inline; filename="${asset.filename}"`
        : `attachment; filename="${asset.filename}"`;

    return new Response(Buffer.from(asset.data), {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    const user = await requireApiUser();
    const { kind: kindRaw } = await params;
    const kind = personalAssetKindSchema.parse(kindRaw);
    const existing = await prisma.personalAsset.findUnique({
      where: { userId_kind: { userId: user.id, kind } },
    });
    if (!existing) return jsonError("Arquivo não encontrado", 404);
    await prisma.personalAsset.delete({
      where: { userId_kind: { userId: user.id, kind } },
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
