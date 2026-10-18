import { describe, expect, it } from "vitest";
import {
  downEmailHtml,
  expiryEmailHtml,
  recoveryEmailHtml,
} from "@/lib/email";

describe("email templates pt-BR", () => {
  it("renders down email with links", () => {
    const html = downEmailHtml({
      projectName: "Demo",
      environment: "production",
      serviceName: "API",
      checkName: "/health",
      checkUrl: "https://demo.example/health",
      error: "timeout",
      at: "18/10/2026",
      consecutiveFails: 3,
      lastLatencyMs: 1200,
      httpStatus: 503,
      adminUrl: "https://panel.example",
      hostingUrl: "https://host.example",
      gitUrl: "https://git.example",
      panelUrl: "http://localhost:3000/projects/1",
    });
    expect(html).toContain("Serviço fora do ar");
    expect(html).toContain("Demo");
    expect(html).toContain("Painel do serviço");
    expect(html).toContain("https://demo.example/health");
    expect(html).toContain("503");
  });

  it("renders recovery email with duration", () => {
    const html = recoveryEmailHtml({
      projectName: "Demo",
      environment: "production",
      serviceName: "API",
      checkName: "/health",
      duration: "5m 12s",
      at: "18/10/2026",
      lastLatencyMs: 90,
      panelUrl: "http://localhost:3000/projects/1",
    });
    expect(html).toContain("Serviço recuperado");
    expect(html).toContain("5m 12s");
    expect(html).toContain("90 ms");
  });

  it("renders expiry email", () => {
    const html = expiryEmailHtml({
      kind: "Credencial",
      label: "Meta Token",
      projectName: "Demo",
      serviceName: "Meta",
      expiresAt: "01/11/2026",
      daysLeft: 7,
      panelUrl: "http://localhost:3000/credentials",
    });
    expect(html).toContain("Expiração próxima");
    expect(html).toContain("7 dia");
  });
});
