import net from "net";
import tls from "tls";
import type { HealthCheck } from "@prisma/client";

export type ExecResult = {
  ok: boolean;
  httpStatus?: number;
  latencyMs: number;
  errorMessage?: string;
};

export async function executeCheck(check: HealthCheck): Promise<ExecResult> {
  const start = Date.now();
  try {
    switch (check.type) {
      case "http":
        return await runHttp(check, start);
      case "tcp":
        return await runTcp(check, start);
      case "ssl_expiry":
        return await runSslExpiry(check, start);
      case "domain_expiry":
        return await runDomainExpiry(check, start);
      case "db_ping":
        return await runHttp(check, start);
      default: {
        const _exhaustive: never = check.type;
        return {
          ok: false,
          latencyMs: Date.now() - start,
          errorMessage: `Tipo não suportado: ${_exhaustive}`,
        };
      }
    }
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      errorMessage: e instanceof Error ? e.message : "erro desconhecido",
    };
  }
}

async function runHttp(check: HealthCheck, start: number): Promise<ExecResult> {
  if (!check.url) {
    return { ok: false, latencyMs: 0, errorMessage: "URL não configurada" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), check.timeoutMs);
  try {
    let headers: Record<string, string> = {};
    if (check.headersJson) {
      headers = JSON.parse(check.headersJson) as Record<string, string>;
    }
    const res = await fetch(check.url, {
      method: check.method || "GET",
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
    const latencyMs = Date.now() - start;
    const text = await res.text().catch(() => "");
    if (res.status !== check.expectedStatus) {
      return {
        ok: false,
        httpStatus: res.status,
        latencyMs,
        errorMessage: `Status ${res.status}, esperado ${check.expectedStatus}`,
      };
    }
    if (check.expectedBody && !text.includes(check.expectedBody)) {
      return {
        ok: false,
        httpStatus: res.status,
        latencyMs,
        errorMessage: "Corpo da resposta não contém o texto esperado",
      };
    }
    return { ok: true, httpStatus: res.status, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

function runTcp(check: HealthCheck, start: number): Promise<ExecResult> {
  return new Promise((resolve) => {
    if (!check.host || !check.port) {
      resolve({ ok: false, latencyMs: 0, errorMessage: "Host/porta não configurados" });
      return;
    }
    const socket = new net.Socket();
    const onDone = (ok: boolean, errorMessage?: string) => {
      socket.destroy();
      resolve({ ok, latencyMs: Date.now() - start, errorMessage });
    };
    socket.setTimeout(check.timeoutMs);
    socket.once("connect", () => onDone(true));
    socket.once("timeout", () => onDone(false, "Timeout TCP"));
    socket.once("error", (err) => onDone(false, err.message));
    socket.connect(check.port, check.host);
  });
}

function runSslExpiry(check: HealthCheck, start: number): Promise<ExecResult> {
  return new Promise((resolve) => {
    const target = check.url || check.host;
    if (!target) {
      resolve({ ok: false, latencyMs: 0, errorMessage: "Host não configurado" });
      return;
    }
    let hostname = target;
    try {
      if (target.startsWith("http")) hostname = new URL(target).hostname;
    } catch {
      /* use as-is */
    }
    const port = check.port || 443;
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          resolve({
            ok: false,
            latencyMs: Date.now() - start,
            errorMessage: "Certificado SSL indisponível",
          });
          return;
        }
        const expires = new Date(cert.valid_to);
        const days = (expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (days < 7) {
          resolve({
            ok: false,
            latencyMs: Date.now() - start,
            errorMessage: `SSL expira em ${Math.floor(days)} dia(s)`,
          });
          return;
        }
        resolve({ ok: true, latencyMs: Date.now() - start });
      },
    );
    socket.setTimeout(check.timeoutMs);
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, latencyMs: Date.now() - start, errorMessage: "Timeout SSL" });
    });
    socket.on("error", (err) => {
      resolve({ ok: false, latencyMs: Date.now() - start, errorMessage: err.message });
    });
  });
}

async function runDomainExpiry(
  check: HealthCheck,
  start: number,
): Promise<ExecResult> {
  // Lightweight WHOIS via rdap for common TLDs
  const host = check.host || (check.url ? new URL(check.url).hostname : null);
  if (!host) {
    return { ok: false, latencyMs: 0, errorMessage: "Domínio não configurado" };
  }
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(check.timeoutMs),
    });
    if (!res.ok) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        httpStatus: res.status,
        errorMessage: `RDAP ${res.status}`,
      };
    }
    const data = (await res.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };
    const expiry = data.events?.find(
      (e) => e.eventAction === "expiration" || e.eventAction === "expiry",
    );
    if (!expiry?.eventDate) {
      return {
        ok: true,
        latencyMs: Date.now() - start,
        errorMessage: "Sem data de expiração no RDAP (considerado ok)",
      };
    }
    const days =
      (new Date(expiry.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days < 14) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        errorMessage: `Domínio expira em ${Math.floor(days)} dia(s)`,
      };
    }
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      errorMessage: e instanceof Error ? e.message : "falha RDAP",
    };
  }
}
