import { useEffect, useRef, useState } from "react";

export const YOLO_API_URL = "http://localhost:8000";

type Props = {
  streamUrl: string;
  /** Liga o envio de frames para o servidor YOLO local. */
  yoloAtivo?: boolean;
  /** Requisições por segundo (aprox.). */
  fps?: number;
  onStatus?: (s: { online: boolean; erro: string | null }) => void;
  /** Chamado quando o servidor YOLO informa EPIs detectados/faltando. */
  onDeteccao?: (d: { detectados: string[]; faltando: string[] }) => void;
  /** Falha ao abrir/manter a câmera. */
  onCameraErro?: (msg: string) => void;
  /** Quando true, a imagem processada pela IA fica em tela grande. */
  iaPrincipal?: boolean;
  /** Clique na miniatura para alternar qual fica em tela grande. */
  onAlternarPrincipal?: () => void;
};

export const CameraPlayer = ({
  streamUrl,
  yoloAtivo = false,
  fps = 5,
  onStatus,
  onDeteccao,
  onCameraErro,
  iaPrincipal = false,
  onAlternarPrincipal,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [processada, setProcessada] = useState<string | null>(null);
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

  // Envio de frames para o YOLO local
  useEffect(() => {
    if (!yoloAtivo) {
      setProcessada((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      onStatusRef.current?.({ online: false, erro: null });
      return;
    }

    let vivo = true;
    let ocupado = false;
    let objectUrl: string | null = null;
    const controllers = new Set<AbortController>();
    const canvas = document.createElement("canvas");

    const checarSaude = async () => {
      const ac = new AbortController();
      controllers.add(ac);
      const t = setTimeout(() => ac.abort(), 4000);
      try {
        const r = await fetch(`${YOLO_API_URL}/health`, { signal: ac.signal });
        if (vivo) onStatusRef.current?.({ online: r.ok, erro: r.ok ? null : "IA local offline — inicie o servidor YOLO no notebook" });
      } catch {
        if (vivo) onStatusRef.current?.({ online: false, erro: "IA local offline — inicie o servidor YOLO no notebook" });
      } finally {
        clearTimeout(t);
        controllers.delete(ac);
      }
    };

    void checarSaude();
    const healthTimer = setInterval(() => void checarSaude(), 10000);

    const enviar = async () => {
      if (!vivo || ocupado) return;
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      ocupado = true;
      const ac = new AbortController();
      controllers.add(ac);
      try {
        const escala = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * escala);
        canvas.height = Math.round(video.videoHeight * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", 0.7),
        );
        if (!blob || !vivo) return;

        const fd = new FormData();
        fd.append("file", blob, "frame.jpg");

        const r = await fetch(`${YOLO_API_URL}/detect`, {
          method: "POST",
          body: fd,
          signal: ac.signal,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const lista = (v: string | null) =>
          (v ?? "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

        const detectados = lista(
          r.headers.get("x-detections") ?? r.headers.get("x-epis-detectados"),
        );
        const faltando = lista(
          r.headers.get("x-missing") ?? r.headers.get("x-epis-faltando"),
        );

        const out = await r.blob();
        if (!vivo) return;
        const url = URL.createObjectURL(out);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = url;
        setProcessada(url);
        onStatusRef.current?.({ online: true, erro: null });
        if (detectados.length || faltando.length) {
          onDeteccaoRef.current?.({ detectados, faltando });
        }

      } catch (e) {
        if (vivo && (e as Error).name !== "AbortError") {
          onStatusRef.current?.({
            online: false,
            erro: "IA local offline — inicie o servidor YOLO no notebook",
          });
        }
      } finally {
        controllers.delete(ac);
        ocupado = false;
      }
    };

    const timer = setInterval(() => void enviar(), Math.max(100, 1000 / Math.max(1, fps)));

    return () => {
      vivo = false;
      clearInterval(timer);
      clearInterval(healthTimer);
      controllers.forEach((c) => c.abort());
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setProcessada(null);
    };
  }, [yoloAtivo, fps]);

  const mostrarIa = yoloAtivo && !!processada;
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
          src={processada!}
          alt="Frame com detecções do YOLO"
          onClick={grandeIa ? undefined : onAlternarPrincipal}
          className={
            grandeIa
              ? "absolute inset-0 w-full h-full object-cover"
              : "absolute bottom-2 right-2 z-20 w-1/3 max-w-[180px] rounded-md border border-border/60 shadow-lg cursor-pointer"
          }
        />
      )}
    </>
  );
};
