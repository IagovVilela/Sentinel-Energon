import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { alertRuleSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    const body = alertRuleSchema.partial().parse(await req.json());
    const rule = await prisma.alertRule.update({
      where: { id },
      data: body,
    });
    return jsonOk({ rule });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    await prisma.alertRule.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
