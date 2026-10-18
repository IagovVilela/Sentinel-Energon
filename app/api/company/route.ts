import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { companyProfileSchema, emptyToNull } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";
import { ensureCompanyProfile } from "@/lib/company";

export async function GET() {
  try {
    const user = await requireApiUser();
    const company = await ensureCompanyProfile(user.id, user.email);
    return jsonOk({ company });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = companyProfileSchema.parse(await req.json());
    await ensureCompanyProfile(user.id, user.email);
    const company = await prisma.companyProfile.update({
      where: { userId: user.id },
      data: {
        name: body.name,
        tagline: emptyToNull(body.tagline),
        email: emptyToNull(body.email),
        phone: emptyToNull(body.phone),
        whatsapp: emptyToNull(body.whatsapp),
        instagram: emptyToNull(body.instagram),
        websiteUrl: emptyToNull(body.websiteUrl),
        subscriptionUrl: emptyToNull(body.subscriptionUrl),
      },
    });
    return jsonOk({ company });
  } catch (err) {
    return handleApiError(err);
  }
}
