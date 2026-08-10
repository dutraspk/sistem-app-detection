import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
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
import { Camera as CamIcon, Wifi, WifiOff, Plus, Trash2, ScanEye, Loader2, Maximize2, Minimize2, CameraOff } from "lucide-react";
import { useStore, store } from "@/lib/store";
import { CameraPlayer } from "@/components/CameraPlayer";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Camera } from "@/lib/mock-data";



export const Route = createFileRoute("/cameras")({ component: Cameras });

function CameraCard({ c }: { c: Camera }) {
  const on = c.status === "online";
  const [ia, setIa] = useState(false);
  const [status, setStatus] = useState<{ online: boolean; erro: string | null }>({
    online: false,
    erro: null,
  });
  const [ultimo, setUltimo] = useState<string | null>(null);
  const ultimaOcorrencia = useRef(0);
  const [ligada, setLigada] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === boxRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const alternarTela = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await boxRef.current?.requestFullscreen();
    } catch {
      toast.error("Não foi possível abrir em tela cheia.");
    }
  };

  const onStatus = useCallback((s: { online: boolean; erro: string | null }) => {
    setStatus(s);
  }, []);

  const onDeteccao = useCallback(
    ({ faltando }: { detectados: string[]; faltando: string[] }) => {
      if (!faltando.length) {
        setUltimo("Liberado — todos os EPIs detectados");
        return;
      }
      setUltimo(`Bloqueado — faltando ${faltando.join(", ")}`);

      // evita spam: no máximo 1 ocorrência por minuto por câmera
      const agora = Date.now();
      if (agora - ultimaOcorrencia.current < 60_000) return;
      ultimaOcorrencia.current = agora;

      toast.error(`${c.nome}: EPI faltando (${faltando.join(", ")})`);
      store.addOcorrencia({
        tipo: `EPI faltando: ${faltando.join(", ")}`,
        trabalhador: "Não identificado",
        local: c.setor || c.nome,
        camera: c.nome,
        gravidade: "Alta",
        data: new Date().toISOString(),
        status: "Aberta",
        observacoes: `Detectado automaticamente pela IA local (YOLO) na câmera ${c.nome}.`,
      });
    },
    [c.nome, c.setor],
  );

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div ref={boxRef} className="relative aspect-video bg-gradient-to-br from-secondary via-card to-background flex items-center justify-center">
        {c.url && ligada ? (
          <>
            <CameraPlayer
              streamUrl={c.url}
              yoloAtivo={ia}
              fps={5}
              onStatus={onStatus}
              onDeteccao={onDeteccao}
            />

            <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 bg-destructive/90 text-destructive-foreground rounded pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />Rec
            </div>
            {ia && (
              <div
                className={`absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded pointer-events-none ${
                  status.online
                    ? "bg-success/90 text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status.online ? <ScanEye className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                {status.online ? "IA Online" : "IA Offline"}
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[10px] text-white/70 pointer-events-none">
              <span className="font-mono">{c.id}</span>
              <span>{c.fps} fps</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void alternarTela()}
              className="absolute bottom-8 right-3 z-20 h-7 px-2 text-[11px]"
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5 mr-1" /> : <Maximize2 className="w-3.5 h-3.5 mr-1" />}
              {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            </Button>
          </>
        ) : (
          <div className="text-center">
            {c.url ? (
              <>
                <CameraOff className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Câmera desligada</p>
              </>
            ) : (
              <>
                <WifiOff className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-xs text-destructive mt-2">Aguardando conexão</p>
              </>
            )}
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
        <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">
          {c.url.startsWith("device:") ? "Câmera local do dispositivo" : c.url}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs font-medium">Câmera: {ligada ? "ON" : "OFF"}</p>
            <p className="text-[11px] text-muted-foreground">
              {ligada ? "Webcam ativa e visível" : "Webcam liberada — clique para reativar"}
            </p>
          </div>
          <Switch checked={ligada} onCheckedChange={setLigada} disabled={!c.url} />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">

          <div>
            <p className="text-xs font-medium">Fiscalização por IA</p>
            <p className="text-[11px] text-muted-foreground">
              {!ia
                ? "Desligada"
                : status.online
                  ? (ultimo ?? "IA Online — enviando ~5 frames/s ao YOLO local")
                  : (status.erro ?? "Conectando ao servidor YOLO local…")}
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
    setPermErro(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setPermErro("Este navegador não permite acessar câmeras locais.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
    } catch (e) {
      const nome = e instanceof Error ? e.name : "";
      const emIframe = typeof window !== "undefined" && window.self !== window.top;
      setPermErro(
        nome === "NotAllowedError"
          ? emIframe
            ? "A pré-visualização bloqueia a câmera. Abra o app em uma aba nova (botão de abrir em nova janela) e permita o acesso."
            : "Permissão de câmera negada. Autorize o acesso no cadeado da barra de endereço."
          : nome === "NotFoundError"
            ? "Nenhuma câmera encontrada neste computador."
            : `Não foi possível acessar a câmera (${nome || "erro desconhecido"}).`,
      );
    }
    try {
      const todos = await navigator.mediaDevices.enumerateDevices();
      const cams = todos.filter((d) => d.kind === "videoinput");
      setDispositivos(cams);
      if (cams.length) setPermErro((p) => (p && !cams[0].label ? p : null));
    } catch {
      setDispositivos([]);
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
