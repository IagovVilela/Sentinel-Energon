import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { healthCheckSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    const body = healthCheckSchema
      .partial()
      .omit({ serviceId: true })
      .parse(await req.json());

    const check = await prisma.healthCheck.update({
      where: { id },
      data: {
        ...(body.name != null ? { name: body.name } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.host !== undefined ? { host: body.host } : {}),
        ...(body.port !== undefined ? { port: body.port } : {}),
        ...(body.method ? { method: body.method } : {}),
        ...(body.headersJson !== undefined
          ? { headersJson: body.headersJson }
          : {}),
        ...(body.expectedStatus != null
          ? { expectedStatus: body.expectedStatus }
          : {}),
        ...(body.expectedBody !== undefined
          ? { expectedBody: body.expectedBody }
          : {}),
        ...(body.timeoutMs != null ? { timeoutMs: body.timeoutMs } : {}),
        ...(body.intervalSec != null ? { intervalSec: body.intervalSec } : {}),
        ...(body.failureThreshold != null
          ? { failureThreshold: body.failureThreshold }
          : {}),
        ...(body.enabled != null ? { enabled: body.enabled } : {}),
      },
    });
    return jsonOk({ check });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    await prisma.healthCheck.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
