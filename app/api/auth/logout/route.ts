import { destroySession } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

export async function POST() {
  try {
    await destroySession();
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
