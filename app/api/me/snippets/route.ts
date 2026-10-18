import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personalSnippetSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireApiUser();
    const snippets = await prisma.personalSnippet.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return jsonOk({ snippets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = personalSnippetSchema.parse(await req.json());
    const max = await prisma.personalSnippet.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const snippet = await prisma.personalSnippet.create({
      data: {
        userId: user.id,
        title: body.title,
        body: body.body,
        sortOrder: body.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    return jsonOk({ snippet }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
