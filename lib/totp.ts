import { generateSecret, generateURI, verify } from "otplib";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(secret: string, email: string): string {
  return generateURI({
    issuer: "Energon Sentinel",
    label: email,
    secret,
  });
}

export async function verifyTotp(
  secret: string,
  token: string,
): Promise<boolean> {
  try {
    const cleaned = token.replace(/\s/g, "").trim();
    if (!/^\d{6}$/.test(cleaned)) return false;

    // ±1 passo (30s) cobre atraso de relógio entre celular e servidor
    const result = await verify({
      secret: secret.replace(/\s/g, "").toUpperCase(),
      token: cleaned,
      epochTolerance: 30,
    });
    return result.valid === true;
  } catch {
    return false;
  }
}
