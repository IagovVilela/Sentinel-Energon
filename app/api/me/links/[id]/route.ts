import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personalLinkSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const existing = await prisma.personalLink.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("Link não encontrado", 404);
    const body = personalLinkSchema.partial().parse(await req.json());
    const link = await prisma.personalLink.update({
      where: { id },
      data: {
        ...(body.label != null ? { label: body.label } : {}),
        ...(body.url != null ? { url: body.url } : {}),
        ...(body.sortOrder != null ? { sortOrder: body.sortOrder } : {}),
      },
    });
    return jsonOk({ link });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const existing = await prisma.personalLink.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("Link não encontrado", 404);
    await prisma.personalLink.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
