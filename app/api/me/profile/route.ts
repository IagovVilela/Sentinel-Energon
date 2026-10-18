import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { emptyToNull, personalProfileSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";
import { ensurePersonalProfile } from "@/lib/me";

export async function GET() {
  try {
    const user = await requireApiUser();
    const profile = await ensurePersonalProfile(user.id, {
      fullName: user.name || "Iago Vilela Ventura",
      email: user.email,
    });
    const [links, snippets, assets] = await Promise.all([
      prisma.personalLink.findMany({
        where: { userId: user.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.personalSnippet.findMany({
        where: { userId: user.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.personalAsset.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          kind: true,
          filename: true,
          mimeType: true,
          updatedAt: true,
        },
      }),
    ]);
    return jsonOk({ profile, links, snippets, assets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = personalProfileSchema.parse(await req.json());
    await ensurePersonalProfile(user.id, {
      fullName: body.fullName,
      email: body.email,
    });
    const profile = await prisma.personalProfile.update({
      where: { userId: user.id },
      data: {
        fullName: body.fullName,
        email: body.email,
        linkedinUrl: emptyToNull(body.linkedinUrl),
        companyUrl: emptyToNull(body.companyUrl),
        headline: emptyToNull(body.headline),
      },
    });
    return jsonOk({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}
