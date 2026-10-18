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
    const result = await verify({
      secret,
      token: token.replace(/\s/g, ""),
    });
    return result.valid === true;
  } catch {
    return false;
  }
}
