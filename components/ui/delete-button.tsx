"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  endpoint,
  label = "Excluir",
  confirmMessage = "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
  redirectTo,
  size = "sm",
  variant = "destructive",
  onDeleted,
}: {
  endpoint: string;
  label?: string;
  confirmMessage?: string;
  redirectTo?: string;
  size?: "sm" | "default" | "icon";
  variant?: "destructive" | "ghost" | "outline";
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Falha ao excluir");
        return;
      }
      toast.success("Excluído");
      onDeleted?.();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={loading}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {size !== "icon" && (loading ? "Excluindo…" : label)}
    </Button>
  );
}
