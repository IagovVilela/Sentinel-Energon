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

type ProjectData = {
  id: string;
  name: string;
  description: string | null;
  publicUrl: string | null;
  environment: "production" | "staging";
  statusPageEnabled: boolean;
  statusPageSlug: string | null;
};

export function ProjectEditActions({ project }: { project: ProjectData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    publicUrl: project.publicUrl || "",
    environment: project.environment,
    statusPageEnabled: project.statusPageEnabled,
    statusPageSlug: project.statusPageSlug || "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          publicUrl: form.publicUrl || null,
          environment: form.environment,
          statusPageEnabled: form.statusPageEnabled,
          statusPageSlug: form.statusPageSlug || null,
          tags: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success("Sistema atualizado");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar sistema
        </Button>
        <DeleteButton
          endpoint={`/api/projects/${project.id}`}
          confirmMessage={`Excluir o sistema "${project.name}" e todos os serviços/credenciais?`}
          redirectTo="/projects"
          label="Excluir sistema"
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>URL pública</Label>
            <Input
              type="url"
              value={form.publicUrl}
              onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Ambiente</Label>
            <select
              className="w-full h-9 rounded-md border border-card-border bg-[#0d1024] px-3 text-sm"
              value={form.environment}
              onChange={(e) =>
                setForm({
                  ...form,
                  environment: e.target.value as "production" | "staging",
                })
              }
            >
              <option value="production">Produção</option>
              <option value="staging">Homologação</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="statusPage"
              type="checkbox"
              checked={form.statusPageEnabled}
              onChange={(e) =>
                setForm({ ...form, statusPageEnabled: e.target.checked })
              }
            />
            <Label htmlFor="statusPage">Página de status pública</Label>
          </div>
          {form.statusPageEnabled && (
            <div className="space-y-1">
              <Label>Slug da status page</Label>
              <Input
                value={form.statusPageSlug}
                onChange={(e) =>
                  setForm({ ...form, statusPageSlug: e.target.value })
                }
                placeholder="demo-commerce"
              />
            </div>
          )}
          <div className="flex gap-2">
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
