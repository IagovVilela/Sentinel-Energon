import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  totp: z.string().optional(),
});

export const setupTotpSchema = z.object({
  code: z.string().min(6).max(8),
});

export const reauthSchema = z.object({
  password: z.string().optional(),
  totp: z.string().optional(),
}).refine(
  (d: { password?: string; totp?: string }) => d.password || d.totp,
  {
    message: "Informe senha ou código 2FA",
  },
);

export const projectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  environment: z.enum(["production", "staging"]).default("production"),
  publicUrl: z.string().url().optional().nullable().or(z.literal("")),
  logoUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  statusPageEnabled: z.boolean().optional(),
  statusPageSlug: z.string().max(80).optional().nullable(),
});

export const serviceSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1).max(120),
  category: z.enum([
    "frontend",
    "backend",
    "database",
    "payment",
    "email",
    "meta",
    "whatsapp",
    "hosting",
    "domain",
    "storage",
    "other",
  ]),
  provider: z.string().max(120).optional().nullable(),
  adminUrl: z.string().url().optional().nullable().or(z.literal("")),
  hostingUrl: z.string().url().optional().nullable().or(z.literal("")),
  gitUrl: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().max(5000).optional().nullable(),
});

export const credentialSchema = z.object({
  serviceId: z.string().cuid(),
  type: z.enum([
    "login",
    "api_key",
    "token",
    "secret",
    "connection_string",
    "other",
  ]),
  label: z.string().min(1).max(120),
  username: z.string().max(320).optional().nullable(),
  secret: z.string().min(1),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  notes: z.string().max(5000).optional().nullable(),
});

export const healthCheckSchema = z.object({
  serviceId: z.string().cuid(),
  name: z.string().min(1).max(120),
  type: z.enum(["http", "tcp", "ssl_expiry", "domain_expiry", "db_ping"]),
  url: z.string().optional().nullable(),
  host: z.string().optional().nullable(),
  port: z.number().int().positive().optional().nullable(),
  method: z.string().default("GET"),
  headersJson: z.string().optional().nullable(),
  expectedStatus: z.number().int().default(200),
  expectedBody: z.string().optional().nullable(),
  timeoutMs: z.number().int().min(1000).max(60000).default(10000),
  intervalSec: z.number().int().min(30).max(3600).default(60),
  failureThreshold: z.number().int().min(1).max(10).default(2),
  enabled: z.boolean().default(true),
});

export const alertRuleSchema = z.object({
  email: z.string().email(),
  notifyDown: z.boolean().default(true),
  notifyRecovery: z.boolean().default(true),
  notifyExpiry: z.boolean().default(true),
  reminderHours: z.number().int().min(1).max(72).default(4),
  enabled: z.boolean().default(true),
});

export const maintenanceSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const emptyToNull = (v: string | null | undefined) =>
  !v || v === "" ? null : v;

export const personalProfileSchema = z.object({
  fullName: z.string().min(1).max(160),
  email: z.string().email(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  companyUrl: z.string().url().optional().nullable().or(z.literal("")),
  headline: z.string().max(280).optional().nullable(),
});

export const personalLinkSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url(),
  sortOrder: z.number().int().optional(),
});

export const personalSnippetSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(10000),
  sortOrder: z.number().int().optional(),
});

export const personalAssetKindSchema = z.enum(["photo", "resume"]);

export const companyProfileSchema = z.object({
  name: z.string().min(1).max(160),
  tagline: z.string().max(280).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  instagram: z.string().max(80).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  subscriptionUrl: z.string().url().optional().nullable().or(z.literal("")),
});
