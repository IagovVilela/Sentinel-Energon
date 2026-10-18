"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const router = useRouter();

  async function logoutAll() {
    const res = await fetch("/api/auth/logout-all", { method: "POST" });
    if (!res.ok) {
      toast.error("Falha ao encerrar sessões");
      return;
    }
    toast.success("Sessões encerradas em todos os dispositivos");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted">Segurança da conta e sessões</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Encerra o login neste e em todos os outros dispositivos.
          </p>
          <Button variant="destructive" onClick={logoutAll}>
            Sair de todos os dispositivos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2FA</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/setup-2fa")}>
            Reconfigurar 2FA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
