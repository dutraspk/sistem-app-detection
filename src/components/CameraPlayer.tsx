import { useEffect, useRef } from "react";

export const CameraPlayer = ({ streamUrl }: { streamUrl: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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
