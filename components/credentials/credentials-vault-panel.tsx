"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CredentialActions } from "@/components/credentials/credential-actions";
import { CredentialEditActions } from "@/components/credentials/credential-edit-actions";

const TYPE_LABELS: Record<string, string> = {
  login: "Login",
  api_key: "API key",
  token: "Token",
  secret: "Secret",
  connection_string: "Connection string",
  other: "Outro",
};

export type VaultCredential = {
  id: string;
  type: string;
  label: string;
  username: string | null;
  expiresAt: Date | string | null;
  notes: string | null;
  createdAt: Date | string;
  service: {
    id: string;
    name: string;
    category: string;
    project: { id: string; name: string };
  };
};

export function CredentialsVaultPanel({
  credentials,
  canEdit,
  highlightId,
}: {
  credentials: VaultCredential[];
  canEdit: boolean;
  highlightId?: string;
}) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const now = Date.now();

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of credentials) {
      map.set(c.service.project.id, c.service.project.name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [credentials]);

  const types = useMemo(() => {
    const set = new Set(credentials.map((c) => c.type));
    return Object.keys(TYPE_LABELS).filter((t) => set.has(t));
  }, [credentials]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return credentials.filter((c) => {
      if (projectId !== "all" && c.service.project.id !== projectId) return false;
      if (type !== "all" && c.type !== type) return false;
      if (!q) return true;
      const haystack = [
        c.label,
        c.username,
        c.notes,
        c.type,
        TYPE_LABELS[c.type],
        c.service.name,
        c.service.project.name,
        CATEGORY_LABELS[c.service.category],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [credentials, query, projectId, type]);

  const activeFilter =
    projectId !== "all" || type !== "all" || query.trim().length > 0;

  function clearFilters() {
    setQuery("");
    setProjectId("all");
    setType("all");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-card-border bg-card/40 p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por label, usuário, sistema, serviço…"
            className="pl-9"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted">Sistema</p>
          <div className="flex flex-wrap gap-2 items-center">
            <FilterChip
              active={projectId === "all"}
              onClick={() => setProjectId("all")}
              label={`Todos (${credentials.length})`}
            />
            {projects.map(([id, name]) => {
              const count = credentials.filter(
                (c) => c.service.project.id === id,
              ).length;
              return (
                <FilterChip
                  key={id}
                  active={projectId === id}
                  onClick={() => setProjectId(id)}
                  label={`${name} (${count})`}
                />
              );
            })}
          </div>
        </div>

        {types.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">Tipo</p>
            <div className="flex flex-wrap gap-2 items-center">
              <FilterChip
                active={type === "all"}
                onClick={() => setType("all")}
                label="Todos os tipos"
              />
              {types.map((t) => {
                const count = credentials.filter((c) => c.type === t).length;
                return (
                  <FilterChip
                    key={t}
                    active={type === t}
                    onClick={() => setType(t)}
                    label={`${TYPE_LABELS[t] || t} (${count})`}
                  />
                );
              })}
              {activeFilter && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted">
          {filtered.length === credentials.length
            ? `${credentials.length} credencial${credentials.length === 1 ? "" : "is"}`
            : `${filtered.length} de ${credentials.length} credenciais`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border px-4 py-8 text-center space-y-2">
          <p className="text-sm font-medium">Nenhuma credencial nesse filtro</p>
          <p className="text-xs text-muted">
            Tente outra busca, sistema ou tipo — ou limpe o filtro.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => {
            const expiresAt =
              c.expiresAt == null
                ? null
                : typeof c.expiresAt === "string"
                  ? new Date(c.expiresAt)
                  : c.expiresAt;
            const days =
              expiresAt != null
                ? Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24))
                : null;
            const highlight = highlightId === c.id;
            return (
              <Card
                key={c.id}
                className={highlight ? "border-accent-cyan/60" : undefined}
              >
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-base">{c.label}</CardTitle>
                    <p className="text-xs text-muted mt-1">
                      {c.service.project.name} · {c.service.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge>{TYPE_LABELS[c.type] || c.type}</Badge>
                      {CATEGORY_LABELS[c.service.category] && (
                        <Badge>{CATEGORY_LABELS[c.service.category]}</Badge>
                      )}
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
                  </div>
                  {canEdit && (
                    <div className="flex flex-col items-end gap-2">
                      <CredentialActions credentialId={c.id} />
                      <CredentialEditActions
                        credential={{
                          id: c.id,
                          label: c.label,
                          username: c.username,
                          expiresAt,
                          notes: c.notes,
                        }}
                      />
                    </div>
                  )}
                </CardHeader>
                {c.notes && (
                  <CardContent>
                    <p className="text-sm text-muted">{c.notes}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-accent-cyan/90 to-accent-indigo/90 text-white"
          : "rounded-md px-2.5 py-1 text-xs font-medium border border-card-border text-muted hover:text-foreground hover:border-accent-cyan/50 transition-colors"
      }
    >
      {label}
    </button>
  );
}
