import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Camera as CamIcon, Wifi, WifiOff, Plus, Trash2, ScanEye, Loader2 } from "lucide-react";
import { useStore, store } from "@/lib/store";
import { CameraPlayer } from "@/components/CameraPlayer";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { analisarFrame } from "@/lib/analise.functions";
import { toast } from "sonner";
import type { Camera } from "@/lib/mock-data";

export const Route = createFileRoute("/cameras")({ component: Cameras });

function CameraCard({ c }: { c: Camera }) {
  const on = c.status === "online";
  const [ia, setIa] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const analisar = useServerFn(analisarFrame);
  const ocupado = useRef(false);

  const onFrame = useCallback(
    async (base64: string) => {
      if (ocupado.current) return;
      ocupado.current = true;
      setAnalisando(true);
      try {
        const r = await analisar({
          data: {
            camera: c.nome,
            setor: c.setor,
            epis_obrigatorios: [],
            frame_base64: base64,
          },
        });
        if (r.gravado) {
          setUltimo(
            r.validacao === "Bloqueado"
              ? `Bloqueado — faltando ${r.epis_faltando.join(", ")}`
              : "Liberado — todos os EPIs detectados",
          );
          if (r.validacao === "Bloqueado") {
            toast.error(`${c.nome}: EPI faltando (${r.epis_faltando.join(", ")})`);
            store.addOcorrencia({
              tipo: `EPI faltando: ${r.epis_faltando.join(", ")}`,
              trabalhador: "Não identificado",
              local: c.setor || c.nome,
              camera: c.nome,
              gravidade: "Alta",
              data: new Date().toISOString(),
              status: "Aberta",
              observacoes: `Detectado automaticamente pela IA na câmera ${c.nome}.`,
            });

          }
        } else {
          setUltimo("Nenhuma pessoa no frame");
        }
      } catch (e) {
        setUltimo(e instanceof Error ? e.message : "Falha na análise");
      } finally {
        ocupado.current = false;
        setAnalisando(false);
      }
    },
    [analisar, c.nome, c.setor],
  );

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="relative aspect-video bg-gradient-to-br from-secondary via-card to-background flex items-center justify-center">
        {c.url ? (
          <>
            <CameraPlayer streamUrl={c.url} onFrame={ia ? onFrame : undefined} intervaloSegundos={8} />
            <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 bg-destructive/90 text-destructive-foreground rounded pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />Rec
            </div>
            {ia && (
              <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 bg-primary/90 text-primary-foreground rounded pointer-events-none">
                {analisando ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanEye className="w-3 h-3" />}
                IA
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[10px] text-white/70 pointer-events-none">
              <span className="font-mono">{c.id}</span>
              <span>{c.fps} fps</span>
            </div>
          </>
        ) : (
          <div className="text-center">
            <WifiOff className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-xs text-destructive mt-2">Aguardando conexão</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">{c.nome}</p>
          <div className="flex items-center gap-1">
            {on
              ? <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15"><Wifi className="w-3 h-3 mr-1" />Online</Badge>
              : <Badge className="bg-muted text-muted-foreground border-border">Offline</Badge>}
            <button onClick={() => store.removeCamera(c.id)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{c.setor} · {c.tipo}</p>
        <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">{c.url}</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs font-medium">Fiscalização por IA</p>
            <p className="text-[11px] text-muted-foreground">
              {ia ? (ultimo ?? "Analisando frames a cada 8s…") : "Desligada"}
            </p>
          </div>
          <Switch checked={ia} onCheckedChange={setIa} disabled={!c.url} />
        </div>
      </div>
    </Card>
  );
}


function Cameras() {
  const cameras = useStore("cameras");
  const [open, setOpen] = useState(false);
  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);
  const [permErro, setPermErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "", setor: "", tipo: "Entrada" as "Entrada" | "Interna",
    url: "", status: "online" as "online" | "offline", fps: 30,
  });

  const carregarDispositivos = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
      const todos = await navigator.mediaDevices.enumerateDevices();
      const cams = todos.filter((d) => d.kind === "videoinput");
      setDispositivos(cams);
      setPermErro(cams.length ? null : "Nenhuma câmera encontrada neste dispositivo.");
    } catch {
      setPermErro("Permissão de câmera negada. Autorize o acesso no navegador.");
    }
  }, []);

  const abrir = (v: boolean) => {
    setOpen(v);
    if (v) void carregarDispositivos();
  };

  const submit = () => {
    if (!form.url) return;
    const escolhida = dispositivos.find((d) => `device:${d.deviceId}` === form.url);
    const nome = form.nome.trim() || escolhida?.label || "Câmera do notebook";
    store.addCamera({ ...form, nome });
    setForm({ nome: "", setor: "", tipo: "Entrada", url: "", status: "online", fps: 30 });
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader title="Câmeras com IA" description="Câmeras conectadas ao seu computador (webcam / USB)">
        <Dialog open={open} onOpenChange={abrir}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova câmera</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar câmera</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Câmera conectada</Label>
                <Select value={form.url} onValueChange={v => setForm({ ...form, url: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a câmera" /></SelectTrigger>
                  <SelectContent>
                    {dispositivos.map((d, i) => (
                      <SelectItem key={d.deviceId || i} value={`device:${d.deviceId}`}>
                        {d.label || `Câmera ${i + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] text-muted-foreground flex-1">
                    {permErro ?? "Detectadas automaticamente do seu notebook — sem IP ou configuração."}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => void carregarDispositivos()}>Atualizar</Button>
                </div>
              </div>
              <div><Label>Nome (opcional)</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Entrada Forno A" /></div>
              <div><Label>Setor</Label><Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v as "Entrada" | "Interna" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Interna">Interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={!form.url}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>


      {cameras.length === 0 ? (
        <EmptyState
          icon={CamIcon}
          title="Nenhuma câmera cadastrada"
          description="Escolha uma das câmeras conectadas ao seu notebook (webcam ou USB). A IA analisa os frames direto do navegador e envia as ocorrências para o painel."
          action={<Button onClick={() => abrir(true)}><Plus className="w-4 h-4 mr-2" />Adicionar câmera</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cameras.map(c => <CameraCard key={c.id} c={c} />)}
        </div>

      )}
    </AppShell>
  );
}
