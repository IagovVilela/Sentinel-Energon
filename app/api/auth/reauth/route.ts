import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { markReauth, requireApiUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { verifyTotp } from "@/lib/totp";
import { reauthSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireApiUser();
    const body = reauthSchema.parse(await req.json());
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
    });

    let ok = false;
    if (body.password) {
      ok = await verifyPassword(user.passwordHash, body.password);
    }
    if (!ok && body.totp && user.totpSecret) {
      ok = await verifyTotp(user.totpSecret, body.totp);
    }
    if (!ok) {
      return jsonError("Reautenticação falhou", 401);
    }

    await markReauth(user.id);
    return jsonOk({ ok: true, validForMinutes: 5 });
  } catch (err) {
    return handleApiError(err);
  }
}
