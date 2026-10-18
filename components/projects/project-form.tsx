"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [environment, setEnvironment] = useState<"production" | "staging">(
    "production",
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          publicUrl: publicUrl || null,
          environment,
          tags: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar");
        return;
      }
      toast.success("Sistema criado");
      setOpen(false);
      setName("");
      setDescription("");
      setPublicUrl("");
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo sistema
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>URL pública</Label>
            <Input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="space-y-1">
            <Label>Ambiente</Label>
            <select
              className="w-full h-9 rounded-md border border-card-border bg-[#0d1024] px-3 text-sm"
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value as "production" | "staging")
              }
            >
              <option value="production">Produção</option>
              <option value="staging">Homologação</option>
            </select>
          </div>
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
