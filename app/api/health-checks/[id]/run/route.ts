import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { enqueueCheckNow } from "@/lib/queue";
import { runHealthCheck } from "@/lib/monitoring/runner";
import { handleApiError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    await requireApiUser(["owner", "admin"]);
    const { id } = await ctx.params;
    // Run inline for immediate feedback; also enqueue for worker consistency
    const result = await runHealthCheck(id);
    await enqueueCheckNow(id).catch(() => {});
    return jsonOk({ result });
  } catch (err) {
    return handleApiError(err);
  }
}
