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

const emptyForm = {
  name: "",
  category: "backend",
  provider: "",
  adminUrl: "",
  hostingUrl: "",
  gitUrl: "",
  notes: "",
};

export function ServiceForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function cancel() {
    setForm(emptyForm);
    setOpen(false);
  }

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
      setForm(emptyForm);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" />
        Novo serviço
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-lg border-accent-cyan/40">
      <CardContent className="pt-4">
        <p className="text-sm font-semibold mb-3">Novo serviço</p>
        <p className="text-xs text-muted mb-3">
          Formulário em branco para um serviço novo. Para alterar um existente,
          use Editar no card dele abaixo.
        </p>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Nome</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Front-end, API, Banco"
              autoComplete="off"
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
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label>URL do painel</Label>
            <Input
              type="url"
              value={form.adminUrl}
              onChange={(e) => setForm({ ...form, adminUrl: e.target.value })}
              placeholder="https://…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label>Hospedagem</Label>
            <Input
              type="url"
              value={form.hostingUrl}
              onChange={(e) => setForm({ ...form, hostingUrl: e.target.value })}
              placeholder="https://…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Repositório Git</Label>
            <Input
              type="url"
              value={form.gitUrl}
              onChange={(e) => setForm({ ...form, gitUrl: e.target.value })}
              placeholder="https://github.com/…"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              Criar serviço
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
