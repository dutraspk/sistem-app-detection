import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, WifiOff, Clock, ShieldX, CheckCircle2, Bell } from "lucide-react";
import { useStore, store } from "@/lib/store";

export const Route = createFileRoute("/notificacoes")({ component: Notificacoes });

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Crítico": ShieldX,
  "Alerta": WifiOff,
  "Aviso": Clock,
  "Info": CheckCircle2,
};
const toneMap: Record<string, string> = {
  "Crítico": "bg-destructive/15 text-destructive ring-destructive/30",
  "Alerta": "bg-warning/15 text-warning ring-warning/30",
  "Aviso": "bg-primary/15 text-primary ring-primary/30",
  "Info": "bg-success/15 text-success ring-success/30",
};

function Notificacoes() {
  const notificacoes = useStore("notificacoes");

  return (
    <AppShell>
      <PageHeader title="Notificações" description="Alertas em tempo real do sistema de fiscalização">
        {notificacoes.length > 0 && (
          <>
            <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
              <Bell className="w-3 h-3 mr-1" />{notificacoes.length} novas
            </Badge>
            <Button size="sm" variant="secondary" onClick={() => store.clearNotificacoes()}>Limpar tudo</Button>
          </>
        )}
      </PageHeader>

      {notificacoes.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação"
          description="Alertas críticos (capacete removido, máscara ausente, câmera offline) aparecem aqui em tempo real assim que a IA detectar."
        />
      ) : (
        <Card className="bg-card border-border divide-y divide-border">
          {notificacoes.map(n => {
            const Icon = iconMap[n.tipo] ?? AlertTriangle;
            return (
              <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-accent/40 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ring-1 ${toneMap[n.tipo]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{n.titulo}</p>
                    <Badge variant="secondary" className="text-[10px]">{n.tipo}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{n.descricao}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </AppShell>
  );
}
