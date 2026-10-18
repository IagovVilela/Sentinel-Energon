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

type CredentialData = {
  id: string;
  label: string;
  username: string | null;
  expiresAt: Date | string | null;
  notes: string | null;
};

export function CredentialEditActions({
  credential,
}: {
  credential: CredentialData;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const expiresLocal = credential.expiresAt
    ? new Date(credential.expiresAt).toISOString().slice(0, 16)
    : "";
  const [form, setForm] = useState({
    label: credential.label,
    username: credential.username || "",
    secret: "",
    expiresAt: expiresLocal,
    notes: credential.notes || "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        label: form.label,
        username: form.username || null,
        notes: form.notes || null,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : null,
      };
      if (form.secret) payload.secret = form.secret;

      const res = await fetch(`/api/credentials/${credential.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success("Credencial atualizada");
      setOpen(false);
      setForm((f) => ({ ...f, secret: "" }));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        <DeleteButton
          endpoint={`/api/credentials/${credential.id}`}
          confirmMessage={`Excluir a credencial "${credential.label}"?`}
          label="Excluir"
          variant="ghost"
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Rótulo</Label>
            <Input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Usuário / e-mail</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Novo segredo (deixe vazio para manter)</Label>
            <Input
              type="password"
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label>Expira em</Label>
            <Input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
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
