"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/ui/delete-button";
import { RunCheckButton } from "@/components/projects/run-check-button";

type CheckData = {
  id: string;
  name: string;
  url: string | null;
  expectedStatus: number;
};

export function HealthCheckActions({ check }: { check: CheckData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(check.name);
  const [url, setUrl] = useState(check.url || "");
  const [expectedStatus, setExpectedStatus] = useState(
    String(check.expectedStatus),
  );
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/health-checks/${check.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url: url || null,
          expectedStatus: Number(expectedStatus) || 200,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro");
        return;
      }
      toast.success("Check atualizado");
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 w-full">
        <Input
          className="w-28"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          className="flex-1 min-w-[160px]"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
        />
        <Input
          className="w-20"
          value={expectedStatus}
          onChange={(e) => setExpectedStatus(e.target.value)}
          placeholder="200"
        />
        <Button size="sm" onClick={save} disabled={loading}>
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <RunCheckButton checkId={check.id} />
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
      <DeleteButton
        endpoint={`/api/health-checks/${check.id}`}
        confirmMessage={`Excluir o check "${check.name}"?`}
        label="Excluir"
        variant="ghost"
      />
    </div>
  );
}
