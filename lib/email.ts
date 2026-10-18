import { Resend } from "resend";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  eventType: string;
  alertRuleId?: string;
  metadata?: Record<string, unknown>;
};

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "Energon Sentinel <onboarding@resend.dev>";
  const result = await resend.emails.send({ from, to, subject, html });
  if (result.error) throw new Error(result.error.message);
  return result;
}

async function sendViaSmtp(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("Nenhum provedor de e-mail configurado");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "sentinel@energon.local",
    to,
    subject,
    html,
  });
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  let success = false;
  let error: string | undefined;
  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(payload.to, payload.subject, payload.html);
    } else {
      await sendViaSmtp(payload.to, payload.subject, payload.html);
    }
    success = true;
  } catch (e) {
    success = false;
    error = e instanceof Error ? e.message : "falha no envio";
    console.error("[email]", error);
  }

  await prisma.notificationLog.create({
    data: {
      alertRuleId: payload.alertRuleId,
      channel: "email",
      eventType: payload.eventType,
      recipient: payload.to,
      subject: payload.subject,
      bodyPreview: payload.html.slice(0, 500),
      success,
      error,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    },
  });

  return success;
}

export function baseEmailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0A0C1F;font-family:Segoe UI,Roboto,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0C1F;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12152B;border:1px solid #1E2340;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px 24px;background:linear-gradient(90deg,#22D3EE,#6366F1,#A855F7);">
          <strong style="color:#0A0C1F;font-size:16px;">Energon Sentinel</strong>
        </td></tr>
        <tr><td style="padding:24px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#F8FAFC;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #1E2340;font-size:12px;color:#94A3B8;">
          Notificação automática do painel Energon Sentinel.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailRow(label: string, value: string | null | undefined) {
  if (value == null || value === "") return "";
  return `<tr>
    <td style="padding:6px 0;color:#94A3B8;vertical-align:top;width:140px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#F8FAFC;">${escapeHtml(value)}</td>
  </tr>`;
}

function actionLinks(opts: {
  adminUrl?: string | null;
  hostingUrl?: string | null;
  gitUrl?: string | null;
  panelUrl: string;
}) {
  return [
    opts.adminUrl
      ? `<a href="${opts.adminUrl}" style="color:#22D3EE;">Painel do serviço</a>`
      : null,
    opts.hostingUrl
      ? `<a href="${opts.hostingUrl}" style="color:#22D3EE;">Hospedagem</a>`
      : null,
    opts.gitUrl
      ? `<a href="${opts.gitUrl}" style="color:#22D3EE;">Repositório Git</a>`
      : null,
    `<a href="${opts.panelUrl}" style="color:#22D3EE;">Abrir no Sentinel</a>`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export type IncidentEmailDetails = {
  projectName: string;
  environment?: string | null;
  serviceName: string;
  checkName: string;
  checkUrl?: string | null;
  error: string;
  at: string;
  consecutiveFails?: number | null;
  lastLatencyMs?: number | null;
  httpStatus?: number | null;
  duration?: string | null;
  reminder?: boolean;
  adminUrl?: string | null;
  hostingUrl?: string | null;
  gitUrl?: string | null;
  panelUrl: string;
};

export function downEmailHtml(opts: IncidentEmailDetails) {
  const title = opts.reminder
    ? "Lembrete: serviço ainda fora do ar"
    : "Serviço fora do ar";
  const headline = opts.reminder
    ? `<p><strong style="color:#F59E0B;">⏱ Incidente ainda aberto</strong></p>`
    : `<p><strong style="color:#F43F5E;">⚠ Queda detectada</strong></p>`;

  const rows = [
    detailRow("Sistema", opts.projectName),
    detailRow("Ambiente", opts.environment),
    detailRow("Serviço", opts.serviceName),
    detailRow("Check", opts.checkName),
    detailRow("URL checada", opts.checkUrl),
    detailRow("Erro / causa", opts.error),
    detailRow("Horário", opts.at),
    detailRow(
      "Falhas consecutivas",
      opts.consecutiveFails != null ? String(opts.consecutiveFails) : null,
    ),
    detailRow(
      "Última latência",
      opts.lastLatencyMs != null ? `${opts.lastLatencyMs} ms` : null,
    ),
    detailRow(
      "HTTP status",
      opts.httpStatus != null ? String(opts.httpStatus) : null,
    ),
    detailRow("Duração", opts.duration),
  ].join("");

  return baseEmailLayout(
    title,
    `${headline}
     <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0 16px;">${rows}</table>
     <p style="margin:0;">${actionLinks(opts)}</p>
     <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">Abra o Sentinel, verifique o serviço e a hospedagem, e confirme se o health check voltou a responder.</p>`,
  );
}

export function recoveryEmailHtml(opts: {
  projectName: string;
  environment?: string | null;
  serviceName: string;
  checkName: string;
  checkUrl?: string | null;
  duration: string;
  at: string;
  lastLatencyMs?: number | null;
  adminUrl?: string | null;
  hostingUrl?: string | null;
  gitUrl?: string | null;
  panelUrl: string;
}) {
  const rows = [
    detailRow("Sistema", opts.projectName),
    detailRow("Ambiente", opts.environment),
    detailRow("Serviço", opts.serviceName),
    detailRow("Check", opts.checkName),
    detailRow("URL checada", opts.checkUrl),
    detailRow("Duração da queda", opts.duration),
    detailRow("Horário da recuperação", opts.at),
    detailRow(
      "Latência atual",
      opts.lastLatencyMs != null ? `${opts.lastLatencyMs} ms` : null,
    ),
  ].join("");

  return baseEmailLayout(
    "Serviço recuperado",
    `<p><strong style="color:#34D399;">✓ Serviço voltou ao ar</strong></p>
     <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0 16px;">${rows}</table>
     <p style="margin:0;">${actionLinks(opts)}</p>`,
  );
}

export function expiryEmailHtml(opts: {
  kind: string;
  label: string;
  projectName: string;
  serviceName: string;
  expiresAt: string;
  daysLeft: number;
  panelUrl: string;
}) {
  return baseEmailLayout(
    "Expiração próxima",
    `<p><strong style="color:#F59E0B;">⏱ ${opts.kind} expira em ${opts.daysLeft} dia(s)</strong></p>
     <p><b>Item:</b> ${opts.label}<br/>
     <b>Sistema:</b> ${opts.projectName}<br/>
     <b>Serviço:</b> ${opts.serviceName}<br/>
     <b>Expira em:</b> ${opts.expiresAt}</p>
     <p><a href="${opts.panelUrl}" style="color:#22D3EE;">Abrir no Sentinel</a></p>`,
  );
}
