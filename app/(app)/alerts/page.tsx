import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertRuleForm } from "@/components/alerts/alert-rule-form";
import { AlertRuleActions } from "@/components/alerts/alert-rule-actions";

export default async function AlertsPage() {
  const user = await requireUser();
  const canEdit = user.role === "owner" || user.role === "admin";
  const [rules, logs] = await Promise.all([
    prisma.alertRule.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.notificationLog.findMany({
      orderBy: { sentAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Alertas</h1>
          <p className="text-sm text-muted">
            Destinatários de e-mail e histórico de notificações
          </p>
        </div>
        {canEdit && <AlertRuleForm />}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rules.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{r.email}</CardTitle>
              {canEdit && (
                <AlertRuleActions
                  rule={{ id: r.id, email: r.email, enabled: r.enabled }}
                />
              )}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1">
              {r.enabled ? (
                <Badge className="text-online">ativo</Badge>
              ) : (
                <Badge>desativado</Badge>
              )}
              {r.notifyDown && <Badge>queda</Badge>}
              {r.notifyRecovery && <Badge>recuperação</Badge>}
              {r.notifyExpiry && <Badge>expiração</Badge>}
              <Badge>lembrete {r.reminderHours}h</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
          Histórico de e-mails
        </h2>
        <Card>
          <CardContent className="pt-4 space-y-2">
            {logs.length === 0 && (
              <p className="text-sm text-muted">Nenhuma notificação enviada.</p>
            )}
            {logs.map((l) => (
              <div
                key={l.id}
                className="flex justify-between gap-3 border-b border-card-border last:border-0 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{l.subject}</p>
                  <p className="text-xs text-muted">
                    {l.recipient} · {l.eventType}
                  </p>
                </div>
                <Badge className={l.success ? "text-online" : "text-down"}>
                  {l.success ? "ok" : "falha"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
