import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { emptyToNull, serviceSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser();
    const { id } = await ctx.params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        project: true,
        credentials: {
          select: {
            id: true,
            type: true,
            label: true,
            username: true,
            expiresAt: true,
            notes: true,
            createdAt: true,
          },
        },
        healthChecks: true,
      },
    });
    if (!service) return jsonError("Serviço não encontrado", 404);
    return jsonOk({ service });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    const body = serviceSchema.partial().omit({ projectId: true }).parse(await req.json());
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(body.name != null ? { name: body.name } : {}),
        ...(body.category ? { category: body.category } : {}),
        ...(body.provider !== undefined ? { provider: body.provider } : {}),
        ...(body.adminUrl !== undefined
          ? { adminUrl: emptyToNull(body.adminUrl) }
          : {}),
        ...(body.hostingUrl !== undefined
          ? { hostingUrl: emptyToNull(body.hostingUrl) }
          : {}),
        ...(body.gitUrl !== undefined ? { gitUrl: emptyToNull(body.gitUrl) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });
    return jsonOk({ service });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    await prisma.service.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
