import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { emptyToNull, projectSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser();
    const { id } = await ctx.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: [{ category: "asc" }, { name: "asc" }],
          include: {
            healthChecks: { orderBy: { name: "asc" } },
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
            _count: { select: { credentials: true } },
          },
        },
        incidents: {
          orderBy: { startedAt: "desc" },
          take: 20,
          include: { service: { select: { name: true } } },
        },
        maintenanceWindows: {
          where: { endsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
        },
      },
    });
    if (!project) return jsonError("Sistema não encontrado", 404);
    return jsonOk({ project });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    const body = projectSchema.partial().parse(await req.json());
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.name != null ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.environment ? { environment: body.environment } : {}),
        ...(body.publicUrl !== undefined
          ? { publicUrl: emptyToNull(body.publicUrl) }
          : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.tags ? { tags: body.tags } : {}),
        ...(body.statusPageEnabled !== undefined
          ? { statusPageEnabled: body.statusPageEnabled }
          : {}),
        ...(body.statusPageSlug !== undefined
          ? { statusPageSlug: body.statusPageSlug || null }
          : {}),
      },
    });
    return jsonOk({ project });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    await prisma.project.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
