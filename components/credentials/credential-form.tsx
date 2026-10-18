"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function CredentialForm({
  services,
  defaultServiceId,
}: {
  services: Array<{ id: string; name: string; project: { name: string } }>;
  defaultServiceId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    serviceId: defaultServiceId || services[0]?.id || "",
    type: "api_key",
    label: "",
    username: "",
    secret: "",
    expiresAt: "",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expiresAt: form.expiresAt
            ? new Date(form.expiresAt).toISOString()
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro");
        return;
      }
      toast.success("Credencial salva (criptografada)");
      setOpen(false);
      setForm((f) => ({ ...f, label: "", username: "", secret: "", notes: "" }));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} disabled={!services.length}>
        <Plus className="h-4 w-4" />
        Nova credencial
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Serviço</Label>
            <select
              className="w-full h-9 rounded-md border border-card-border bg-[#0d1024] px-3 text-sm"
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.project.name} · {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <select
                className="w-full h-9 rounded-md border border-card-border bg-[#0d1024] px-3 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="login">Login</option>
                <option value="api_key">API Key</option>
                <option value="token">Token</option>
                <option value="secret">Secret</option>
                <option value="connection_string">Connection string</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Expira em</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
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
            <Label>Segredo</Label>
            <Input
              type="password"
              required
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              autoComplete="off"
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
