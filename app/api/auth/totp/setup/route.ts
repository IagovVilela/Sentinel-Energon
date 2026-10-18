import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { generateTotpSecret, getTotpUri, verifyTotp } from "@/lib/totp";
import { setupTotpSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireApiUser();
    const secret = generateTotpSecret();
    // Temporarily store pending secret in totpSecret if not enabled yet
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
    const uri = getTotpUri(secret, user.email);
    const qrDataUrl = await QRCode.toDataURL(uri);
    return jsonOk({ secret, uri, qrDataUrl });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = setupTotpSchema.parse(await req.json());
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!dbUser.totpSecret) {
      return jsonError("Gere o QR Code antes de confirmar", 400);
    }
    if (!(await verifyTotp(dbUser.totpSecret, body.code))) {
      return jsonError("Código inválido", 400);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
