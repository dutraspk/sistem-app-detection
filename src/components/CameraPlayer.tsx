import { useEffect, useRef } from "react";

type Props = {
  streamUrl: string;
  /** Quando definido, captura frames periodicamente para análise da IA. */
  onFrame?: (base64: string) => void;
  /** Intervalo entre capturas, em segundos. */
  intervaloSegundos?: number;
};

export const CameraPlayer = ({ streamUrl, onFrame, intervaloSegundos = 8 }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

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

  // Captura de frames para a IA
  useEffect(() => {
    if (!onFrame) return;
    const canvas = document.createElement("canvas");

    const capturar = () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      const escala = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * escala);
      canvas.height = Math.round(video.videoHeight * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      onFrameRef.current?.(canvas.toDataURL("image/jpeg", 0.7));
    };

    const t = setInterval(capturar, Math.max(3, intervaloSegundos) * 1000);
    const primeira = setTimeout(capturar, 2500);
    return () => {
      clearInterval(t);
      clearTimeout(primeira);
    };
  }, [onFrame, intervaloSegundos]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      className="absolute inset-0 bg-black"
    />
  );
};
