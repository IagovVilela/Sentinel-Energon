"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function Setup2faForm() {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);

  async function loadQr(rotate = false) {
    setLoadingQr(true);
    try {
      const res = await fetch(
        `/api/auth/totp/setup${rotate ? "?rotate=1" : ""}`,
      );
      const d = await res.json();
      if (d.qrDataUrl) {
        setQr(d.qrDataUrl);
        setSecret(d.secret);
        if (rotate) {
          toast.message("Novo QR gerado — escaneie de novo no autenticador");
        }
      } else {
        toast.error(d.error || "Falha ao gerar 2FA");
      }
    } catch {
      toast.error("Erro ao carregar 2FA");
    } finally {
      setLoadingQr(false);
    }
  }

  useEffect(() => {
    void loadQr(false);
  }, []);

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Código inválido");
        return;
      }
      toast.success("2FA ativado");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {loadingQr && !qr && (
          <p className="text-sm text-muted text-center">Gerando QR Code…</p>
        )}
        {qr && (
          <div className="flex flex-col items-center gap-3">
            <Image
              src={qr}
              alt="QR Code 2FA"
              width={180}
              height={180}
              unoptimized
            />
            <p className="text-xs text-muted break-all text-center">
              Chave manual:{" "}
              <code className="text-accent-cyan">{secret}</code>
            </p>
            <p className="text-[11px] text-muted text-center max-w-sm">
              Escaneie uma vez. Se o código falhar, apague a conta antiga no
              autenticador, gere um novo QR e escaneie de novo.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loadingQr}
              onClick={() => void loadQr(true)}
            >
              Gerar novo QR
            </Button>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="code">Código de 6 dígitos</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />
        </div>
        <Button
          onClick={confirm}
          disabled={loading || code.length !== 6}
          className="w-full"
        >
          Confirmar e ativar
        </Button>
      </CardContent>
    </Card>
  );
}
