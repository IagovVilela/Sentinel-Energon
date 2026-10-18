import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const DEK_LENGTH = 32;

function getMasterKey(): Buffer {
  const raw = process.env.MASTER_KEY;
  if (!raw) {
    throw new Error("MASTER_KEY não configurada");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("MASTER_KEY deve ser 32 bytes em base64");
  }
  return key;
}

export type EncryptedPayload = {
  ciphertext: string;
  dekEncrypted: string;
  iv: string;
  authTag: string;
};

/** Envelope encryption: random DEK encrypts secret; master key encrypts DEK. */
export function encryptSecret(plaintext: string): EncryptedPayload {
  const masterKey = getMasterKey();
  const dek = randomBytes(DEK_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, dek, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const dekIv = randomBytes(IV_LENGTH);
  const dekCipher = createCipheriv(ALGORITHM, masterKey, dekIv);
  const dekEncrypted = Buffer.concat([
    dekCipher.update(dek),
    dekCipher.final(),
  ]);
  const dekAuthTag = dekCipher.getAuthTag();

  // Pack dek IV + authTag + ciphertext into dekEncrypted field
  const dekPayload = Buffer.concat([dekIv, dekAuthTag, dekEncrypted]);

  return {
    ciphertext: encrypted.toString("base64"),
    dekEncrypted: dekPayload.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  const masterKey = getMasterKey();
  const dekPayload = Buffer.from(payload.dekEncrypted, "base64");
  const dekIv = dekPayload.subarray(0, IV_LENGTH);
  const dekAuthTag = dekPayload.subarray(IV_LENGTH, IV_LENGTH + 16);
  const dekCiphertext = dekPayload.subarray(IV_LENGTH + 16);

  const dekDecipher = createDecipheriv(ALGORITHM, masterKey, dekIv);
  dekDecipher.setAuthTag(dekAuthTag);
  const dek = Buffer.concat([
    dekDecipher.update(dekCiphertext),
    dekDecipher.final(),
  ]);

  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, dek, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/** Encrypt arbitrary JSON/binary for export backup with a password-derived key. */
export function encryptBackup(data: string, password: string): string {
  const salt = randomBytes(16);
  const key = createHash("sha256")
    .update(Buffer.concat([Buffer.from(password, "utf8"), salt]))
    .digest();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decryptBackup(blob: string, password: string): string {
  const buf = Buffer.from(blob, "base64");
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 16 + IV_LENGTH);
  const tag = buf.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + 16);
  const encrypted = buf.subarray(16 + IV_LENGTH + 16);
  const key = createHash("sha256")
    .update(Buffer.concat([Buffer.from(password, "utf8"), salt]))
    .digest();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
