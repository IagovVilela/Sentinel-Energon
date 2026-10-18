"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReauthDialog } from "@/components/credentials/reauth-dialog";

export function CredentialActions({ credentialId }: { credentialId: string }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"reveal" | "copy" | null>(
    null,
  );
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  async function reveal(action: "reveal" | "copy") {
    const res = await fetch(`/api/credentials/${credentialId}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.status === 403) {
      setPendingAction(action);
      setReauthOpen(true);
      return;
    }
    if (!res.ok) {
      toast.error(data.error || "Erro");
      return;
    }
    if (action === "copy") {
      await navigator.clipboard.writeText(data.secret);
      toast.success("Copiado — área de transferência limpa em 30s");
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch {
          /* ignore */
        }
      }, 30_000);
    } else {
      setSecret(data.secret);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setSecret(null), 30_000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (secret) {
              setSecret(null);
              return;
            }
            void reveal("reveal");
          }}
        >
          {secret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {secret ? "Ocultar" : "Revelar"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => reveal("copy")}>
          <Copy className="h-3.5 w-3.5" />
          Copiar
        </Button>
      </div>
      {secret && (
        <code className="text-xs bg-[#0d1024] border border-card-border rounded px-2 py-1 max-w-xs break-all">
          {secret}
        </code>
      )}
      <ReauthDialog
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        onSuccess={() => {
          if (pendingAction) reveal(pendingAction);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
