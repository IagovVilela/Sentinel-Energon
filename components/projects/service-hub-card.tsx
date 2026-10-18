"use client";

import type { ReactNode } from "react";
import { ExternalLink, GitBranch, Server, KeyRound, Activity } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceEditActions } from "@/components/projects/service-edit-actions";
import { HealthCheckActions } from "@/components/projects/health-check-actions";
import { HealthCheckForm } from "@/components/projects/health-check-form";
import { CredentialActions } from "@/components/credentials/credential-actions";
import { CredentialEditActions } from "@/components/credentials/credential-edit-actions";
import { CredentialForm } from "@/components/credentials/credential-form";

type Credential = {
  id: string;
  type: string;
  label: string;
  username: string | null;
  expiresAt: Date | string | null;
  notes: string | null;
};

type HealthCheck = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  expectedStatus: number;
  lastStatus: string | null;
  lastLatencyMs: number | null;
};

type Service = {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  adminUrl: string | null;
  hostingUrl: string | null;
  gitUrl: string | null;
  notes: string | null;
  credentials: Credential[];
  healthChecks: HealthCheck[];
};

export function ServiceHubCard({
  service,
  projectName,
  canEdit,
}: {
  service: Service;
  projectName: string;
  canEdit: boolean;
}) {
  const now = Date.now();

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {service.name}
              {service.provider && <Badge>{service.provider}</Badge>}
            </CardTitle>
            {service.notes && (
              <p className="text-xs text-muted mt-1">{service.notes}</p>
            )}
          </div>
          {canEdit && (
            <ServiceEditActions
              service={{
                id: service.id,
                name: service.name,
                category: service.category,
                provider: service.provider,
                adminUrl: service.adminUrl,
                hostingUrl: service.hostingUrl,
                gitUrl: service.gitUrl,
                notes: service.notes,
              }}
            />
          )}
        </div>

        <div className="rounded-lg border border-card-border bg-[#0d1024]/60 p-3 space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            Links de acesso
          </p>
          <div className="grid gap-2 text-sm">
            <LinkRow
              label="Painel"
              url={service.adminUrl}
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              emptyHint="Cadastre em Editar → URL do painel"
            />
            <LinkRow
              label="Hospedagem"
              url={service.hostingUrl}
              icon={<Server className="h-3.5 w-3.5" />}
              emptyHint="Cadastre em Editar → Hospedagem"
            />
            <LinkRow
              label="Repositório Git"
              url={service.gitUrl}
              icon={<GitBranch className="h-3.5 w-3.5" />}
              emptyHint="Cadastre em Editar → Repositório Git"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Credenciais
            </h3>
            {canEdit && (
              <CredentialForm
                services={[
                  {
                    id: service.id,
                    name: service.name,
                    project: { name: projectName },
                  },
                ]}
                defaultServiceId={service.id}
                lockService
                compact
                buttonLabel="+ Credencial"
              />
            )}
          </div>

          {service.credentials.length === 0 ? (
            <p className="text-xs text-muted rounded-md border border-dashed border-card-border px-3 py-3">
              Nenhuma credencial neste serviço.
            </p>
          ) : (
            <ul className="space-y-2">
              {service.credentials.map((c) => {
                const days =
                  c.expiresAt != null
                    ? Math.ceil(
                        (new Date(c.expiresAt).getTime() - now) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null;
                return (
                  <li
                    key={c.id}
                    className="rounded-md border border-card-border px-3 py-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{c.label}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge>{c.type}</Badge>
                          {c.username && <Badge>{c.username}</Badge>}
                          {days != null && (
                            <Badge
                              className={
                                days <= 7
                                  ? "text-down"
                                  : days <= 30
                                    ? "text-degraded"
                                    : ""
                              }
                            >
                              expira em {days}d
                            </Badge>
                          )}
                        </div>
                        {c.notes && (
                          <p className="text-xs text-muted mt-1">{c.notes}</p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex flex-col items-end gap-2">
                          <CredentialActions credentialId={c.id} />
                          <CredentialEditActions
                            credential={{
                              id: c.id,
                              label: c.label,
                              username: c.username,
                              expiresAt: c.expiresAt,
                              notes: c.notes,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Monitoramento / saúde
            </h3>
            {canEdit && <HealthCheckForm serviceId={service.id} />}
          </div>

          {service.healthChecks.length === 0 ? (
            <p className="text-xs text-muted rounded-md border border-dashed border-card-border px-3 py-3">
              Nenhum health check. Adicione a URL pública (ex.: /health) para
              acompanhar a saúde.
            </p>
          ) : (
            <ul className="space-y-2">
              {service.healthChecks.map((hc) => (
                <li
                  key={hc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-card-border px-3 py-2 text-sm"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusDot
                        status={
                          hc.lastStatus === "fail"
                            ? "down"
                            : hc.lastStatus === "ok"
                              ? "operational"
                              : "unknown"
                        }
                        label={false}
                      />
                      <span>{hc.name}</span>
                      <Badge>{hc.type}</Badge>
                      {hc.lastLatencyMs != null && (
                        <span className="text-xs text-muted">
                          {hc.lastLatencyMs}ms
                        </span>
                      )}
                    </div>
                    {hc.url && (
                      <a
                        href={hc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent-cyan break-all"
                      >
                        {hc.url}
                      </a>
                    )}
                  </div>
                  {canEdit && (
                    <HealthCheckActions
                      check={{
                        id: hc.id,
                        name: hc.name,
                        url: hc.url,
                        expectedStatus: hc.expectedStatus,
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function LinkRow({
  label,
  url,
  icon,
  emptyHint,
}: {
  label: string;
  url: string | null;
  icon: ReactNode;
  emptyHint: string;
}) {
  if (!url) {
    return (
      <div className="flex gap-2 text-muted">
        <span className="w-28 shrink-0 text-xs">{label}</span>
        <span className="text-xs italic">{emptyHint}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-muted">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-accent-cyan break-all text-xs sm:text-sm flex-1 min-w-0"
      >
        {url}
      </a>
      <Button asChild size="sm" variant="secondary">
        <a href={url} target="_blank" rel="noreferrer">
          {icon}
          Abrir
        </a>
      </Button>
    </div>
  );
}
