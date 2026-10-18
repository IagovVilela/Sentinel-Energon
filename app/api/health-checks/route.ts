import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { healthCheckSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";
import { enqueueCheckNow } from "@/lib/queue";

export async function GET(req: NextRequest) {
  try {
    await requireApiUser();
    const serviceId = req.nextUrl.searchParams.get("serviceId");
    const checks = await prisma.healthCheck.findMany({
      where: serviceId ? { serviceId } : undefined,
      orderBy: { name: "asc" },
      include: {
        service: {
          select: { name: true, project: { select: { name: true } } },
        },
      },
    });
    return jsonOk({ checks });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiUser(["owner", "admin"]);
    const body = healthCheckSchema.parse(await req.json());
    const check = await prisma.healthCheck.create({
      data: {
        serviceId: body.serviceId,
        name: body.name,
        type: body.type,
        url: body.url ?? null,
        host: body.host ?? null,
        port: body.port ?? null,
        method: body.method,
        headersJson: body.headersJson ?? null,
        expectedStatus: body.expectedStatus,
        expectedBody: body.expectedBody ?? null,
        timeoutMs: body.timeoutMs,
        intervalSec: body.intervalSec,
        failureThreshold: body.failureThreshold,
        enabled: body.enabled,
      },
    });
    await enqueueCheckNow(check.id).catch(() => {});
    return jsonOk({ check }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
