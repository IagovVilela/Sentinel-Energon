import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personalLinkSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireApiUser();
    const links = await prisma.personalLink.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return jsonOk({ links });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = personalLinkSchema.parse(await req.json());
    const max = await prisma.personalLink.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const link = await prisma.personalLink.create({
      data: {
        userId: user.id,
        label: body.label,
        url: body.url,
        sortOrder: body.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    return jsonOk({ link }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
