import { getSessionUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Não autenticado", 401);
    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
