"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HealthCheckForm({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("/health");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/health-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          name,
          type: "http",
          url,
          method: "GET",
          expectedStatus: 200,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro");
        return;
      }
      toast.success("Check criado");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        + Health check
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
      <Input
        className="w-36"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        className="flex-1 min-w-[200px]"
        type="url"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <Button size="sm" type="submit" disabled={loading}>
        Adicionar
      </Button>
      <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}
