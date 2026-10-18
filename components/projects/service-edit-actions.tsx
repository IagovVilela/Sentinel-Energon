"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { CATEGORY_LABELS } from "@/lib/utils";

const categories = Object.keys(CATEGORY_LABELS);

type ServiceData = {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  adminUrl: string | null;
  hostingUrl: string | null;
  gitUrl: string | null;
  notes: string | null;
};

export function ServiceEditActions({ service }: { service: ServiceData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: service.name,
    category: service.category,
    provider: service.provider || "",
    adminUrl: service.adminUrl || "",
    hostingUrl: service.hostingUrl || "",
    gitUrl: service.gitUrl || "",
    notes: service.notes || "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success("Serviço atualizado");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        <DeleteButton
          endpoint={`/api/services/${service.id}`}
          confirmMessage={`Excluir o serviço "${service.name}"?`}
          label="Excluir"
          variant="ghost"
        />
      </div>
    );
  }

  return (
    <Card className="w-full border-amber-500/30">
      <CardContent className="pt-4">
        <p className="text-sm font-semibold mb-3">
          Editar serviço: {service.name}
        </p>
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
          <div className="space-y-1 sm:col-span-2">
            <Label>Observações</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              Salvar alterações
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
