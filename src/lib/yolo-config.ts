// URL base única do servidor YOLO (/health, /detect, /cameras/config).
// Defina VITE_YOLO_API_URL para outro endereço (ex.: Tailscale); sem ela usa o servidor local.
export const YOLO_API_URL_PADRAO = "http://127.0.0.1:6941";

export function resolverYoloUrl(v?: string): string {
  const u = (v ?? "").trim().replace(/\/+$/, "");
  return u || YOLO_API_URL_PADRAO;
}

export const YOLO_API_URL = resolverYoloUrl(import.meta.env.VITE_YOLO_API_URL as string | undefined);
