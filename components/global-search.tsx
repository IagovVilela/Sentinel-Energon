"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";

type Hit = {
  id: string;
  type: "project" | "service" | "credential";
  title: string;
  subtitle?: string;
  href: string;
};

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setHits(data.hits || []);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className={cn(
          "w-full max-w-lg rounded-xl border border-card-border bg-card shadow-2xl overflow-hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder="Buscar sistemas, serviços ou credenciais…"
          className="w-full border-b border-card-border bg-transparent px-4 py-3 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
            Nenhum resultado
          </Command.Empty>
          {hits.map((hit) => (
            <Command.Item
              key={`${hit.type}-${hit.id}`}
              value={`${hit.title} ${hit.subtitle || ""}`}
              onSelect={() => {
                onOpenChange(false);
                router.push(hit.href);
              }}
              className="flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm cursor-pointer aria-selected:bg-white/10"
            >
              <span>{hit.title}</span>
              {hit.subtitle && (
                <span className="text-xs text-muted">{hit.subtitle}</span>
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
