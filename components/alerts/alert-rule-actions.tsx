"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";

export function AlertRuleActions({
  rule,
}: {
  rule: { id: string; email: string; enabled: boolean };
}) {
  const router = useRouter();

  async function toggle() {
    const res = await fetch(`/api/alerts/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro");
      return;
    }
    toast.success(rule.enabled ? "Alerta desativado" : "Alerta ativado");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={toggle}>
        {rule.enabled ? "Desativar" : "Ativar"}
      </Button>
      <DeleteButton
        endpoint={`/api/alerts/${rule.id}`}
        confirmMessage={`Excluir destinatário ${rule.email}?`}
        label="Excluir"
        variant="ghost"
      />
    </div>
  );
}
