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
      serviceName: "API",
      checkName: "/health",
      error: "timeout",
      at: "18/10/2026",
      adminUrl: "https://panel.example",
      hostingUrl: "https://host.example",
      gitUrl: "https://git.example",
      panelUrl: "http://localhost:3000/projects/1",
    });
    expect(html).toContain("Serviço fora do ar");
    expect(html).toContain("Demo");
    expect(html).toContain("Painel do serviço");
  });

  it("renders recovery email with duration", () => {
    const html = recoveryEmailHtml({
      projectName: "Demo",
      serviceName: "API",
      checkName: "/health",
      duration: "5m 12s",
      at: "18/10/2026",
      panelUrl: "http://localhost:3000/projects/1",
    });
    expect(html).toContain("Serviço recuperado");
    expect(html).toContain("5m 12s");
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
