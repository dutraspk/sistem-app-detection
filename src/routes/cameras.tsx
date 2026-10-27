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
import { Camera as CamIcon, Wifi, WifiOff, Plus, Trash2, ScanEye, Loader2, Maximize2, Minimize2, CameraOff, Repeat2, ShieldAlert } from "lucide-react";
import { useStore, store } from "@/lib/store";
import { CameraPlayer } from "@/components/CameraPlayer";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Camera } from "@/lib/mock-data";
import { EpiSelector } from "@/components/EpiSelector";
import { resolverEpisCamera } from "@/lib/epi-mapping";
import { enviarConfigCamera } from "@/lib/camera-config-sync";



export const Route = createFileRoute("/cameras")({ component: Cameras });

/** Envia (fora do loop de vídeo) os EPIs obrigatórios da câmera salva ao servidor YOLO. */
function sincronizar(cameraId: string) {
  const cam = store.get().cameras.find((x) => x.id === cameraId);
  if (!cam) return Promise.resolve();
  const tId = toast.loading("Enviando EPIs obrigatórios ao servidor YOLO…");
  return enviarConfigCamera(cam, store.getEpis()).then((r) => {
    if (r.ok) toast.success("Servidor YOLO confirmou os EPIs obrigatórios.", { id: tId });
    else toast.error(`Câmera salva localmente, mas o envio ao servidor YOLO falhou: ${r.erro}`, { id: tId, duration: 8000 });
  });
}

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
  const [iaPrincipal, setIaPrincipal] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const iaOnlineRef = useRef<boolean | null>(null);
  const risco = c.area === "Risco";
  const epis = useStore("epis");
  const episPayload = resolverEpisCamera(c, epis);
  const [selOpen, setSelOpen] = useState(false);
  const catsCam = c.categoriasObrigatorias?.length
    ? c.categoriasObrigatorias
    : Array.from(new Set(epis.filter((e) => c.episObrigatorios?.includes(e.id)).map((e) => e.categoria as string)));

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
    if (iaOnlineRef.current !== null && iaOnlineRef.current !== s.online) {
      if (!s.online) {
        store.addNotificacao({
          tipo: "Alerta",
          titulo: `IA (YOLO) sem conexão — ${c.nome}`,
          descricao: s.erro ?? "Conexão com o servidor YOLO local interrompida.",
        });
        toast.error(`IA offline em ${c.nome}`);
      } else {
        store.addNotificacao({
          tipo: "Info",
          titulo: `IA (YOLO) reconectada — ${c.nome}`,
          descricao: "O servidor YOLO local voltou a responder.",
        });
      }
    }
    iaOnlineRef.current = s.online;
  }, [c.nome]);

  const onCameraErro = useCallback((msg: string) => {
    store.addNotificacao({
      tipo: "Crítico",
      titulo: `Falha na câmera — ${c.nome}`,
      descricao: `${msg}. Verifique a conexão do dispositivo.`,
    });
    toast.error(`Falha na câmera ${c.nome}: ${msg}`);
  }, [c.nome]);

  const ultimoCiclo = useRef<string | null>(null);
  const onDeteccao = useCallback(
    ({ detectados, faltando, frame, ocorreuEm }: { detectados: string[]; faltando: string[]; frame?: string; ocorreuEm: string }) => {
      if (!faltando.length) {
        setUltimo("Liberado — todos os EPIs detectados");
        return;
      }
      setUltimo(`Bloqueado — faltando ${faltando.join(", ")}`);

      // Uma única notificação por ciclo de reconhecimento.
      if (ultimoCiclo.current === ocorreuEm) return;
      ultimoCiclo.current = ocorreuEm;

      const emRisco = c.area === "Risco";
      const local = c.setor || c.nome;
      const quando = new Date(ocorreuEm).toLocaleString("pt-BR");
      const pessoa = detectados.some((d) => d === "pessoa" || d === "person") ? "Pessoa" : "Pessoa não identificada";

      store.addNotificacao({
        tipo: emRisco ? "Crítico" : "Alerta",
        titulo: `EPI ausente em ${c.nome}${emRisco ? " (área de risco)" : ""}`,
        descricao: `${quando} • Câmera: ${c.nome} • Local: ${local} • ${pessoa} • EPI não identificado: ${faltando.join(", ")} • Nível: ${emRisco ? "Crítica" : "Alta"}`,
        data: ocorreuEm,
        imagem: frame,
        camera: c.nome,
        local,
      });

      const agora = Date.now();
      // Área de risco: ocorrência obrigatória. Demais: 1 por minuto.
      if (!emRisco && agora - ultimaOcorrencia.current < 60_000) return;
      ultimaOcorrencia.current = agora;

      toast.error(`${c.nome}: EPI faltando (${faltando.join(", ")})`);
      store.addOcorrencia({
        tipo: `EPI faltando: ${faltando.join(", ")}`,
        trabalhador: "Não identificado",
        local,
        camera: c.nome,
        gravidade: emRisco ? "Crítica" : "Alta",
        data: ocorreuEm,
        status: "Aberta",
        observacoes: emRisco
          ? `ÁREA DE RISCO — registro obrigatório. Detectado pela IA local (YOLO) na câmera ${c.nome}. EPIs faltando: ${faltando.join(", ")}.`
          : `Detectado automaticamente pela IA local (YOLO) na câmera ${c.nome}.`,
      });
    },
    [c.nome, c.setor, c.area],
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
              onCameraErro={onCameraErro}
              iaPrincipal={iaPrincipal}
              onAlternarPrincipal={() => setIaPrincipal((v) => !v)}
              cameraId={c.id}
              episPayload={episPayload}
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
            {ia && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIaPrincipal((v) => !v)}
                className="absolute bottom-8 left-3 z-20 h-7 px-2 text-[11px]"
              >
                <Repeat2 className="w-3.5 h-3.5 mr-1" />
                {iaPrincipal ? "Ver câmera" : "Ver IA em tela grande"}
              </Button>
            )}
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
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{c.setor} · {c.tipo}</p>
          <Badge
            className={risco
              ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15"
              : "bg-success/15 text-success border-success/30 hover:bg-success/15"}
          >
            {risco && <ShieldAlert className="w-3 h-3 mr-1" />}
            {risco ? "Área de risco" : "Área segura"}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">
          {c.url.startsWith("device:") ? "Câmera local do dispositivo" : c.url}
        </p>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">EPIs obrigatórios para detecção</p>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setSelOpen(true)}>Editar</Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {catsCam.length === 0
              ? <span className="text-[11px] text-muted-foreground">Nenhuma — servidor usa a lista padrão</span>
              : catsCam.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
          </div>
          {!episPayload.ok && <p className="text-[11px] text-destructive mt-1">{episPayload.erro}</p>}
          {catsCam.length > 0 && (
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className={`text-[11px] ${c.syncYolo?.status === "enviado" ? "text-success" : c.syncYolo?.status === "falhou" ? "text-destructive" : "text-muted-foreground"}`}>
                {c.syncYolo?.status === "enviado"
                  ? `Servidor YOLO confirmou (${new Date(c.syncYolo.em).toLocaleString("pt-BR")})`
                  : c.syncYolo?.status === "falhou"
                    ? `Sincronização falhou: ${c.syncYolo.erro}`
                    : c.syncYolo?.status === "pendente" ? "Enviando ao servidor YOLO…" : "Ainda não enviado ao servidor YOLO"}
              </p>
              {c.syncYolo?.status !== "enviado" && c.syncYolo?.status !== "pendente" && (
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => void sincronizar(c.id)}>Reenviar</Button>
              )}
            </div>
          )}
          <EpiSelector
            open={selOpen}
            onOpenChange={setSelOpen}
            value={catsCam}
            onConfirm={(cats) => {
              store.updateCamera(c.id, { categoriasObrigatorias: cats, episObrigatorios: [] });
              toast.success("Categorias da câmera salvas");
              if (cats.length) void sincronizar(c.id);
            }}
          />

        </div>

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
    area: "Segura" as "Risco" | "Segura",
    url: "", status: "online" as "online" | "offline", fps: 30,
    categoriasObrigatorias: [] as string[],
  });
  const [selNovo, setSelNovo] = useState(false);

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
    const nova = store.addCamera({ ...form, nome });
    toast.success(`Câmera "${nome}" salva localmente.`);
    if (nova.categoriasObrigatorias?.length) void sincronizar(nova.id);
    setForm({ nome: "", setor: "", tipo: "Entrada", area: "Segura", url: "", status: "online", fps: 30, categoriasObrigatorias: [] });
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
              <div>
                <Label>Classificação da área</Label>
                <Select value={form.area} onValueChange={v => setForm({ ...form, area: v as "Risco" | "Segura" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Segura">Área segura</SelectItem>
                    <SelectItem value="Risco">Área de risco</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Em área de risco, toda falta de EPI gera obrigatoriamente uma ocorrência.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-md border border-border p-3 text-center">
                <Label>Categorias de EPI obrigatórias</Label>
                <div className="flex flex-wrap justify-center items-center gap-1">
                  {form.categoriasObrigatorias.map((k) => (
                    <Badge key={k} variant="secondary">{k}</Badge>
                  ))}
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setSelNovo(true)}>
                    Selecionar categorias ({form.categoriasObrigatorias.length})
                  </Button>
                </div>
                <EpiSelector
                  open={selNovo}
                  onOpenChange={setSelNovo}
                  value={form.categoriasObrigatorias}
                  onConfirm={(cats) => setForm((f) => ({ ...f, categoriasObrigatorias: cats }))}
                />
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
