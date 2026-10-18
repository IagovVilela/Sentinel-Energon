import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v: string | undefined) => v === "true" || v === "1"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_SECRET: z.string().min(32),
  MASTER_KEY: z.string().min(1),
  ALLOWED_IPS: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Energon Sentinel <sentinel@energon.local>"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v: string | undefined) => v === "true" || v === "1"),
  CHECK_RETENTION_DAYS: z.coerce.number().default(30),
  INCIDENT_REMINDER_HOURS: z.coerce.number().default(4),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function getAllowedIps(): string[] {
  const raw = process.env.ALLOWED_IPS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
