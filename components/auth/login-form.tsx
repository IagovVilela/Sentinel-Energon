"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totp: totp || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("2FA")) setNeedsTotp(true);
        toast.error(data.error || "Falha no login");
        return;
      }
      if (data.requiresTotpSetup) {
        toast.message("Configure o 2FA para continuar");
        router.push("/setup-2fa");
        router.refresh();
        return;
      }
      toast.success("Bem-vindo");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="gradient-border">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {(needsTotp || totp) && (
            <div className="space-y-2">
              <Label htmlFor="totp">Código 2FA</Label>
              <Input
                id="totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
