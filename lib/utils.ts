import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return "—";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  frontend: "Front-end",
  backend: "Back-end",
  database: "Banco de dados",
  payment: "Pagamentos",
  email: "E-mail",
  meta: "Meta / Facebook",
  whatsapp: "WhatsApp",
  hosting: "Hospedagem",
  domain: "Domínio",
  storage: "Armazenamento",
  other: "Outros",
};

export const STATUS_LABELS: Record<string, string> = {
  operational: "Operacional",
  degraded: "Degradado",
  down: "Fora do ar",
  unknown: "Desconhecido",
};
