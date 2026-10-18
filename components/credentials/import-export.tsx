"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ReauthDialog } from "@/components/credentials/reauth-dialog";

export function ImportExport() {
  const [mode, setMode] = useState<"idle" | "export" | "import">("idle");
  const [password, setPassword] = useState("");
  const [blob, setBlob] = useState("");
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pending, setPending] = useState<"export" | "import" | null>(null);

  async function doExport() {
    const res = await fetch("/api/credentials/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.status === 403) {
      setPending("export");
      setReauthOpen(true);
      return;
    }
    if (!res.ok) {
      toast.error(data.error || "Erro no export");
      return;
    }
    setBlob(data.blob);
    toast.success(`Exportado ${data.count} credenciais`);
  }

  async function doImport() {
    const res = await fetch("/api/credentials/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, blob }),
    });
    const data = await res.json();
    if (res.status === 403) {
      setPending("import");
      setReauthOpen(true);
      return;
    }
    if (!res.ok) {
      toast.error(data.error || "Erro no import");
      return;
    }
    toast.success(`Importadas ${data.imported} credenciais`);
    setMode("idle");
  }

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setMode("export")}>
          Exportar
        </Button>
        <Button variant="outline" onClick={() => setMode("import")}>
          Importar
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardContent className="pt-4 space-y-3">
          <Label>Senha do backup</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "import" && (
            <>
              <Label>Blob criptografado</Label>
              <textarea
                className="w-full min-h-24 rounded-md border border-card-border bg-[#0d1024] p-2 text-xs"
                value={blob}
                onChange={(e) => setBlob(e.target.value)}
              />
            </>
          )}
          {mode === "export" && blob && (
            <textarea
              readOnly
              className="w-full min-h-24 rounded-md border border-card-border bg-[#0d1024] p-2 text-xs"
              value={blob}
            />
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => (mode === "export" ? doExport() : doImport())}
            >
              {mode === "export" ? "Gerar backup" : "Importar"}
            </Button>
            <Button variant="ghost" onClick={() => setMode("idle")}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
      <ReauthDialog
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        onSuccess={() => {
          if (pending === "export") doExport();
          if (pending === "import") doImport();
          setPending(null);
        }}
      />
    </>
  );
}
