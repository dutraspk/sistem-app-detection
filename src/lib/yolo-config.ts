// URL base do servidor YOLO, usada por /health, /detect e /cameras/config.
// Defina VITE_YOLO_API_URL para outro endereço (ex.: Tailscale). Padrão: servidor local.
export const YOLO_API_URL_PADRAO = "http://localhost:6941";

export function normalizarYoloUrl(v?: string): string {
  const u = (v ?? "").trim().replace(/\/+$/, "").replace(/\/(detections|detect|health|cameras\/config)$/, "");
  return u || YOLO_API_URL_PADRAO;
}

export const YOLO_API_URL = normalizarYoloUrl(import.meta.env.VITE_YOLO_API_URL as string | undefined);
