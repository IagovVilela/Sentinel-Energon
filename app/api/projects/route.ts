import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { emptyToNull, projectSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireApiUser();
    const projects = await prisma.project.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { services: true, incidents: true } },
        services: {
          select: {
            id: true,
            healthChecks: { select: { lastStatus: true, lastLatencyMs: true } },
          },
        },
      },
    });
    return jsonOk({ projects });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiUser(["owner", "admin"]);
    const body = projectSchema.parse(await req.json());
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        environment: body.environment,
        publicUrl: emptyToNull(body.publicUrl ?? null),
        logoUrl: body.logoUrl ?? null,
        tags: body.tags ?? [],
        statusPageEnabled: body.statusPageEnabled ?? false,
        statusPageSlug: body.statusPageSlug || null,
      },
    });
    return jsonOk({ project }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
