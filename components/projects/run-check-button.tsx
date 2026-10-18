"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunCheckButton({ checkId }: { checkId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(`/api/health-checks/${checkId}/run`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Falha ao rodar check");
        return;
      }
      toast.success(
        data.result?.status === "ok"
          ? `OK · ${data.result.latencyMs}ms`
          : `Falha · ${data.result?.errorMessage || ""}`,
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={run} disabled={loading}>
      <Play className="h-3.5 w-3.5" />
      {loading ? "Rodando…" : "Rodar agora"}
    </Button>
  );
}
