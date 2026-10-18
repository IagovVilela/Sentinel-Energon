import { destroyAllSessions, requireApiUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

export async function POST() {
  try {
    const user = await requireApiUser();
    await destroyAllSessions(user.id);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
