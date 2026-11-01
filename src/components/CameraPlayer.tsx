import { useEffect, useRef, useState } from "react";
import { interpretarHealth, statusDe, MSG_INACESSIVEL, type EstadoYolo, type StatusYolo } from "@/lib/yolo-health";

import { YOLO_API_URL } from "@/lib/yolo-config";
export { YOLO_API_URL };

type Props = {
  streamUrl: string;
  /** Liga a exibição do stream processado pela IA (MJPEG do servidor YOLO). */
  yoloAtivo?: boolean;
  /** Requisições por segundo (aprox.). */
  fps?: number;
  onStatus?: (s: StatusYolo) => void;
  /** Chamado quando o servidor YOLO informa EPIs detectados/faltando. */
  onDeteccao?: (d: { detectados: string[]; faltando: string[]; frame?: string; ocorreuEm: string }) => void;
  /** Intervalo fixo (ms) entre consultas ao endpoint /detections. */
  intervaloMs?: number;
  /** Falha ao abrir/manter a câmera. */
  onCameraErro?: (msg: string) => void;
  /** Quando true, a imagem processada pela IA fica em tela grande. */
  iaPrincipal?: boolean;
  /** Clique na miniatura para alternar qual fica em tela grande. */
  onAlternarPrincipal?: () => void;
  /** Id da câmera enviado ao servidor de detecção. */
  cameraId?: string;
  /** EPIs obrigatórios já resolvidos (external_name) ou erro de configuração. */
  episPayload?: { ok: true; required_epis: string[] } | { ok: false; erro: string };
};

/** Converte o JSON de GET /detections em listas de EPIs (aceita variações de nomes de campo). */
export function interpretarDeteccoes(json: unknown): { detectados: string[]; faltando: string[] } | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  const lista = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    if (typeof v === "string") return v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    return [];
  };
  const detectados = lista(j.detectados ?? j.detections ?? j.epis_detectados ?? j.detected);
  const faltando = lista(j.faltando ?? j.missing ?? j.epis_faltando);
  if (!detectados.length && !faltando.length) return null;
  return { detectados, faltando };
}

export const CameraPlayer = ({
  streamUrl,
  yoloAtivo = false,
  intervaloMs = 4500,
  onStatus,
  onDeteccao,
  onCameraErro,
  iaPrincipal = false,
  onAlternarPrincipal,
  episPayload,
}: Props) => {
  const episRef = useRef(episPayload);
  episRef.current = episPayload;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamOk, setStreamOk] = useState(false);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const onDeteccaoRef = useRef(onDeteccao);
  onDeteccaoRef.current = onDeteccao;
  const onCameraErroRef = useRef(onCameraErro);
  onCameraErroRef.current = onCameraErro;


  useEffect(() => {
    if (!streamUrl) return;

    // Câmera local do dispositivo (webcam/USB): device:<deviceId>
    if (streamUrl.startsWith("device:")) {
      const deviceId = streamUrl.slice("device:".length);
      let ativo = true;
      let stream: MediaStream | null = null;

      const anexar = (s: MediaStream) => {
        if (!ativo) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        s.getVideoTracks().forEach((t) => {
          t.onended = () => {
            if (ativo) onCameraErroRef.current?.("Transmissão da câmera interrompida");
          };
        });
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = s;
        v.muted = true;
        void v.play().catch(() => {});
      };

      (async () => {
        try {
          // Preferência: dispositivo escolhido. Fallback: qualquer webcam.
          const s = deviceId
            ? await navigator.mediaDevices
                .getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
                .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }))
            : await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          anexar(s);
        } catch (e) {
          console.error("Falha ao abrir a webcam:", e);
          const nome = e instanceof Error ? e.name : "erro desconhecido";
          onCameraErroRef.current?.(
            nome === "NotAllowedError"
              ? "Permissão de câmera negada"
              : nome === "NotFoundError"
                ? "Câmera não encontrada / desconectada"
                : `Falha na câmera (${nome})`,
          );
        }
      })();

      return () => {
        ativo = false;
        const v = videoRef.current;
        if (v) v.srcObject = null;
        stream?.getTracks().forEach((t) => t.stop());
      };
    }

    if (!videoRef.current) return;

    // Normaliza a URL para o endpoint WHEP do MediaMTX
    const whepUrl = streamUrl.endsWith("/") ? `${streamUrl}whep` : `${streamUrl}/whep`;
    const pc = new RTCPeerConnection();

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    async function start() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch(whepUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      const answer = await res.text();
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answer }));
    }

    start().catch(console.error);

    return () => {
      pc.close();
    };
  }, [streamUrl]);

  // IA: stream MJPEG (/video_feed) + consulta periódica de detecções (/detections).
  // O servidor YOLO atual NÃO possui /detect — nenhum frame é enviado pelo navegador.
  useEffect(() => {
    if (!yoloAtivo) {
      setStreamOk(false);
      onStatusRef.current?.(statusDe(null, null, null));
      return;
    }

    let vivo = true;
    const controllers = new Set<AbortController>();

    // Conectividade (health/video_feed) e configuração de EPIs são estados independentes.
    let estado: EstadoYolo | null = null;
    let erroConexao: string | null = null;
    let configErro: string | null = null;
    const emitir = () => onStatusRef.current?.(statusDe(estado, erroConexao, configErro));
    const setConexao = (e: EstadoYolo, msg: string | null) => {
      estado = e;
      erroConexao = msg;
      emitir();
    };

    const checarSaude = async () => {
      const ac = new AbortController();
      controllers.add(ac);
      const t = setTimeout(() => ac.abort(), 4000);
      let resp: { httpOk: boolean; json: unknown } | null = null;
      try {
        const r = await fetch(`${YOLO_API_URL}/health`, { signal: ac.signal });
        resp = { httpOk: r.ok, json: await r.json().catch(() => null) };
      } catch {
        resp = null;
      } finally {
        clearTimeout(t);
        controllers.delete(ac);
      }
      if (!vivo) return;
      const h = interpretarHealth(resp);
      setConexao(h.estado, h.erro);
    };

    void checarSaude();
    const healthTimer = setInterval(() => void checarSaude(), 10000);

    const consultarDeteccoes = async () => {
      if (!vivo) return;
      const cfg = episRef.current;
      if (cfg && !cfg.ok) {
        // Erro de configuração: não consulta e NÃO altera a conectividade.
        if (configErro !== cfg.erro) {
          configErro = cfg.erro;
          emitir();
        }
        return;
      }
      if (configErro) {
        configErro = null;
        emitir();
      }
      const ac = new AbortController();
      controllers.add(ac);
      const t = setTimeout(() => ac.abort(), 4000);
      try {
        const r = await fetch(`${YOLO_API_URL}/detections`, { signal: ac.signal });
        if (!r.ok || !vivo) return;
        const d = interpretarDeteccoes(await r.json().catch(() => null));
        if (!d || !vivo) return;
        // Se o servidor não informar os faltantes, calcula a partir dos EPIs obrigatórios.
        const faltando = d.faltando.length
          ? d.faltando
          : cfg?.ok
            ? cfg.required_epis.filter((e) => !d.detectados.includes(e.toLowerCase()))
            : [];
        onDeteccaoRef.current?.({
          detectados: d.detectados,
          faltando,
          ocorreuEm: new Date().toISOString(),
        });
      } catch {
        // Falha de rede em /detections já é coberta pelo /health periódico.
      } finally {
        clearTimeout(t);
        controllers.delete(ac);
      }
    };

    // Ciclo sequencial: consulta → aguarda intervaloMs completos → próxima consulta.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ciclo = async () => {
      if (!vivo) return;
      await consultarDeteccoes();
      if (vivo) timer = setTimeout(() => void ciclo(), intervaloMs);
    };
    timer = setTimeout(() => void ciclo(), 500);

    return () => {
      vivo = false;
      clearTimeout(timer);
      clearInterval(healthTimer);
      controllers.forEach((c) => c.abort());
      setStreamOk(false);
    };
  }, [yoloAtivo, intervaloMs]);

  const mostrarIa = yoloAtivo;
  const grandeIa = mostrarIa && iaPrincipal;

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={
          grandeIa
            ? { objectFit: "cover" }
            : { width: "100%", height: "100%", objectFit: "cover" }
        }
        className={
          grandeIa
            ? "absolute bottom-2 right-2 z-20 w-1/3 max-w-[180px] aspect-video bg-black rounded-md border border-border/60 shadow-lg cursor-pointer"
            : "absolute inset-0 bg-black"
        }
        onClick={grandeIa ? onAlternarPrincipal : undefined}
      />
      {mostrarIa && (
        <img
          src={`${YOLO_API_URL}/video_feed`}
          alt="Vídeo da câmera com detecções do YOLO"
          onLoad={() => {
            setStreamOk(true);
            onStatusRef.current?.(statusDe("pronto", null, null));
          }}
          onError={() => {
            setStreamOk(false);
            onStatusRef.current?.(statusDe("inacessivel", MSG_INACESSIVEL, null));
          }}
          onClick={grandeIa ? undefined : onAlternarPrincipal}
          className={
            grandeIa
              ? "absolute inset-0 w-full h-full object-cover"
              : "absolute bottom-2 right-2 z-20 w-1/3 max-w-[180px] rounded-md border border-border/60 shadow-lg cursor-pointer"
          }
        />
      )}
      {mostrarIa && !streamOk && !grandeIa && (
        <div className="absolute bottom-2 right-2 z-10 text-[10px] text-muted-foreground bg-background/70 rounded px-2 py-1 pointer-events-none">
          Conectando ao stream da IA…
        </div>
      )}
    </>
  );
};
