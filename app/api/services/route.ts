import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { emptyToNull, serviceSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireApiUser();
    const projectId = req.nextUrl.searchParams.get("projectId");
    const services = await prisma.service.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        project: { select: { id: true, name: true } },
        healthChecks: true,
        _count: { select: { credentials: true } },
      },
    });
    return jsonOk({ services });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiUser(["owner", "admin"]);
    const body = serviceSchema.parse(await req.json());
    const service = await prisma.service.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        category: body.category,
        provider: body.provider ?? null,
        adminUrl: emptyToNull(body.adminUrl),
        hostingUrl: emptyToNull(body.hostingUrl),
        gitUrl: emptyToNull(body.gitUrl),
        notes: body.notes ?? null,
      },
    });
    return jsonOk({ service }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
