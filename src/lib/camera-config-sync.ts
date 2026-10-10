// Envia ao servidor de detecção (YOLO) os EPIs obrigatórios de uma câmera recém-cadastrada.
// Endpoint: POST {YOLO_API_URL}/cameras/config  (JSON { camera_id, required_epis })
// O servidor YOLO fica na rede Tailscale do usuário e não exige chave, por isso a
// chamada é feita pelo navegador (o backend na nuvem não alcança essa rede).
import { YOLO_API_URL } from "@/components/CameraPlayer";
import type { Camera, EPI } from "./mock-data";
import { resolverEpisCamera } from "./epi-mapping";

const emAndamento = new Set<string>();

export type ResultadoSync = { ok: true } | { ok: false; erro: string };

export async function enviarConfigCamera(camera: Camera, epis: EPI[]): Promise<ResultadoSync> {
  const payload = resolverEpisCamera(camera, epis);
  if (!payload.ok) return { ok: false, erro: payload.erro };
  if (!payload.required_epis.length) return { ok: false, erro: "Nenhum EPI obrigatório selecionado." };
  if (emAndamento.has(camera.id)) return { ok: false, erro: "Envio já em andamento." };

  emAndamento.add(camera.id);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(`${YOLO_API_URL}/cameras/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camera_id: camera.id, required_epis: payload.required_epis }),
      signal: ac.signal,
    });
    if (r.status === 404 || r.status === 405)
      return { ok: false, erro: "O servidor YOLO não tem a rota /cameras/config. Atualize o server.py." };
    if (!r.ok) return { ok: false, erro: `Servidor YOLO respondeu HTTP ${r.status}.` };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      erro: (e as Error).name === "AbortError"
        ? "Tempo esgotado ao contactar o servidor YOLO."
        : "Servidor YOLO inacessível (offline ou fora da rede).",
    };
  } finally {
    clearTimeout(t);
    emAndamento.delete(camera.id);
  }
}
