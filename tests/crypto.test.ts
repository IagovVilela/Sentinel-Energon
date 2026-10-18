import { beforeAll, describe, expect, it } from "vitest";
import {
  decryptBackup,
  decryptSecret,
  encryptBackup,
  encryptSecret,
} from "@/lib/crypto";

beforeAll(() => {
  // 32 zero bytes base64 — only for tests
  process.env.MASTER_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("envelope AES-256-GCM", () => {
  it("encrypts and decrypts a secret", () => {
    const plain = "meta_long_lived_token_abc123";
    const enc = encryptSecret(plain);
    expect(enc.ciphertext).not.toContain(plain);
    expect(enc.iv).toBeTruthy();
    expect(enc.authTag).toBeTruthy();
    expect(enc.dekEncrypted).toBeTruthy();
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("produces different ciphertext for same plaintext", () => {
    const a = encryptSecret("same");
    const b = encryptSecret("same");
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(decryptSecret(a)).toBe("same");
    expect(decryptSecret(b)).toBe("same");
  });

  it("encrypts and decrypts backup blob", () => {
    const data = JSON.stringify([{ label: "x", secret: "y" }]);
    const blob = encryptBackup(data, "backup-password");
    expect(blob).not.toContain("secret");
    expect(decryptBackup(blob, "backup-password")).toBe(data);
  });
});
