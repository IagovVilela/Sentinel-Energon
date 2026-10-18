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

  useEffect(() => {
    fetch("/api/auth/totp/setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.qrDataUrl) {
          setQr(d.qrDataUrl);
          setSecret(d.secret);
        } else {
          toast.error(d.error || "Falha ao gerar 2FA");
        }
      })
      .catch(() => toast.error("Erro ao carregar 2FA"));
  }, []);

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
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
        {qr && (
          <div className="flex flex-col items-center gap-3">
            <Image src={qr} alt="QR Code 2FA" width={180} height={180} unoptimized />
            <p className="text-xs text-muted break-all text-center">
              Chave manual: <code className="text-accent-cyan">{secret}</code>
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="code">Código de 6 dígitos</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            inputMode="numeric"
          />
        </div>
        <Button onClick={confirm} disabled={loading || !code} className="w-full">
          Confirmar e ativar
        </Button>
      </CardContent>
    </Card>
  );
}
