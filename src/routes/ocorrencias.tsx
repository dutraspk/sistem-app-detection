import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Trash2, Camera as CamIcon, Download } from "lucide-react";
import { ocorrencias as initial } from "@/lib/mock-data";

export const Route = createFileRoute("/ocorrencias")({ component: Ocorrencias });

const filtros = ["Todas", "Aberta", "Em análise", "Resolvida"] as const;
const gravs = ["Todas", "Baixa", "Média", "Alta", "Crítica"] as const;

function gravBadge(g: string) {
  const map: Record<string, string> = {
    "Crítica": "bg-destructive/15 text-destructive border-destructive/30",
    "Alta": "bg-destructive/15 text-destructive border-destructive/30",
    "Média": "bg-warning/15 text-warning border-warning/30",
    "Baixa": "bg-muted text-muted-foreground border-border",
  };
  return <Badge className={`${map[g]} hover:opacity-100`}>{g}</Badge>;
}

function Ocorrencias() {
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState<(typeof filtros)[number]>("Todas");
  const [grav, setGrav] = useState<(typeof gravs)[number]>("Todas");
  const [obs, setObs] = useState<Record<string, string>>({});

  const list = useMemo(() => items.filter(o =>
    (status === "Todas" || o.status === status) &&
    (grav === "Todas" || o.gravidade === grav)
  ), [items, status, grav]);

  return (
    <AppShell>
      <PageHeader title="Ocorrências" description="Eventos de retirada/uso incorreto de EPI detectados pela IA">
        <Button variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Exportar PDF</Button>
      </PageHeader>

      <Card className="p-4 bg-card border-border mb-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-2">Status:</span>
          {filtros.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs border ${status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>{s}</button>
          ))}
          <span className="text-xs text-muted-foreground self-center ml-4 mr-2">Gravidade:</span>
          {gravs.map(g => (
            <button key={g} onClick={() => setGrav(g)}
              className={`px-3 py-1.5 rounded-md text-xs border ${grav === g ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>{g}</button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {list.map(o => (
          <Card key={o.id} className="bg-card border-border overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/15 ring-1 ring-destructive/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">{o.tipo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.trabalhador} · {o.local} · {new Date(o.data).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setItems(items.filter(i => i.id !== o.id))}
                  className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="font-mono text-[10px] text-muted-foreground">{o.id}</span>
                {gravBadge(o.gravidade)}
                <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <CamIcon className="w-3 h-3" />{o.camera}
                </span>
              </div>

              <div className="mt-4 h-32 rounded-md bg-gradient-to-br from-secondary to-card border border-border flex items-center justify-center text-xs text-muted-foreground">
                Captura YOLOv4 · {o.camera}
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted-foreground">Observações do administrador</label>
                <Textarea
                  className="mt-1 min-h-[60px] text-sm"
                  defaultValue={o.observacoes}
                  onChange={(e) => setObs({ ...obs, [o.id]: e.target.value })}
                  placeholder="Adicionar nota..."
                />
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button size="sm" variant="secondary">Em análise</Button>
                <Button size="sm">Resolver</Button>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <Card className="bg-card border-border p-12 text-center text-muted-foreground xl:col-span-2">
            Nenhuma ocorrência com os filtros atuais.
          </Card>
        )}
      </div>
    </AppShell>
  );
}
