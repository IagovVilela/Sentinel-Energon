import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireApiUser();
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) return jsonOk({ hits: [] });

    const [projects, services, credentials] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        },
        take: 8,
      }),
      prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { provider: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { project: { select: { name: true } } },
        take: 8,
      }),
      prisma.credential.findMany({
        where: {
          OR: [
            { label: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          service: {
            select: { name: true, project: { select: { id: true, name: true } } },
          },
        },
        take: 8,
      }),
    ]);

    const hits = [
      ...projects.map((p) => ({
        id: p.id,
        type: "project" as const,
        title: p.name,
        subtitle: "Sistema",
        href: `/projects/${p.id}`,
      })),
      ...services.map((s) => ({
        id: s.id,
        type: "service" as const,
        title: s.name,
        subtitle: `Serviço · ${s.project.name}`,
        href: `/projects/${s.projectId}`,
      })),
      ...credentials.map((c) => ({
        id: c.id,
        type: "credential" as const,
        title: c.label,
        subtitle: `Credencial · ${c.service.project.name} / ${c.service.name}`,
        href: `/credentials?highlight=${c.id}`,
      })),
    ];

    return jsonOk({ hits });
  } catch (err) {
    return handleApiError(err);
  }
}
