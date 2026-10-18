"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceHubCard } from "@/components/projects/service-hub-card";

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

export type ProjectServiceItem = {
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

export function ProjectServicesPanel({
  services,
  projectName,
  canEdit,
}: {
  services: ProjectServiceItem[];
  projectName: string;
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const availableCategories = useMemo(() => {
    const set = new Set(services.map((s) => s.category));
    return Object.keys(CATEGORY_LABELS).filter((c) => set.has(c));
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      const haystack = [
        s.name,
        s.provider,
        s.notes,
        CATEGORY_LABELS[s.category],
        s.adminUrl,
        s.hostingUrl,
        s.gitUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [services, query, category]);

  const byCategory = useMemo(() => {
    return filtered.reduce<Record<string, ProjectServiceItem[]>>((acc, s) => {
      (acc[s.category] ||= []).push(s);
      return acc;
    }, {});
  }, [filtered]);

  const activeFilter = category !== "all" || query.trim().length > 0;

  function clearFilters() {
    setQuery("");
    setCategory("all");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-card-border bg-card/40 p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, provedor, Meta, Stripe…"
            className="pl-9"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label={`Todos (${services.length})`}
          />
          {availableCategories.map((c) => {
            const count = services.filter((s) => s.category === c).length;
            return (
              <FilterChip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
                label={`${CATEGORY_LABELS[c] || c} (${count})`}
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

        <p className="text-xs text-muted">
          {filtered.length === services.length
            ? `${services.length} serviço${services.length === 1 ? "" : "s"}`
            : `${filtered.length} de ${services.length} serviços`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border px-4 py-8 text-center space-y-2">
          <p className="text-sm font-medium">Nenhum serviço nesse filtro</p>
          <p className="text-xs text-muted">
            Tente outra busca ou categoria — ou limpe o filtro.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        Object.entries(byCategory).map(([cat, list]) => (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
              {CATEGORY_LABELS[cat] || cat}
              <span className="ml-2 normal-case tracking-normal text-muted/70">
                ({list.length})
              </span>
            </h2>
            <div className="grid gap-4">
              {list.map((service) => (
                <ServiceHubCard
                  key={service.id}
                  projectName={projectName}
                  canEdit={canEdit}
                  service={service}
                />
              ))}
            </div>
          </section>
        ))
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
