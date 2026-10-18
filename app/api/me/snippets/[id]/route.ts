import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personalSnippetSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const existing = await prisma.personalSnippet.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("Texto não encontrado", 404);
    const body = personalSnippetSchema.partial().parse(await req.json());
    const snippet = await prisma.personalSnippet.update({
      where: { id },
      data: {
        ...(body.title != null ? { title: body.title } : {}),
        ...(body.body != null ? { body: body.body } : {}),
        ...(body.sortOrder != null ? { sortOrder: body.sortOrder } : {}),
      },
    });
    return jsonOk({ snippet });
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
    const existing = await prisma.personalSnippet.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("Texto não encontrado", 404);
    await prisma.personalSnippet.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
