"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/lib/utils";

const categories = Object.keys(CATEGORY_LABELS);

export function ServiceForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "backend",
    provider: "",
    adminUrl: "",
    hostingUrl: "",
    gitUrl: "",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro");
        return;
      }
      toast.success("Serviço criado");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo serviço
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="pt-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Nome</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <select
              className="w-full h-9 rounded-md border border-card-border bg-[#0d1024] px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Provedor</Label>
            <Input
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="Vercel, Stripe…"
            />
          </div>
          <div className="space-y-1">
            <Label>URL do painel</Label>
            <Input
              type="url"
              value={form.adminUrl}
              onChange={(e) => setForm({ ...form, adminUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Hospedagem</Label>
            <Input
              type="url"
              value={form.hostingUrl}
              onChange={(e) => setForm({ ...form, hostingUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Repositório Git</Label>
            <Input
              type="url"
              value={form.gitUrl}
              onChange={(e) => setForm({ ...form, gitUrl: e.target.value })}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              Salvar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
