// Envia ao servidor de detecção (YOLO) os EPIs obrigatórios de uma câmera recém-cadastrada.
// Endpoint: POST {YOLO_API_URL}/cameras/config  (JSON { camera_id, required_epis })
// O servidor YOLO fica na rede Tailscale do usuário e não exige chave, por isso a
// chamada é feita pelo navegador (o backend na nuvem não alcança essa rede).
import { YOLO_API_URL } from "@/components/CameraPlayer";
import type { Camera, EPI } from "./mock-data";
import { resolverEpisCamera } from "./epi-mapping";
import { store } from "./store";

const emAndamento = new Set<string>();

export type ResultadoSync = { ok: true } | { ok: false; erro: string };

/** POST idempotente: o servidor substitui a lista da câmera (mesmo camera_id), sem duplicar. */
export async function enviarConfigCamera(camera: Camera, epis: EPI[]): Promise<ResultadoSync> {
  const payload = resolverEpisCamera(camera, epis);
  const marcar = (s: Camera["syncYolo"]) => store.updateCamera(camera.id, { syncYolo: s });
  if (!payload.ok) {
    marcar({ status: "falhou", em: new Date().toISOString(), erro: payload.erro });
    return { ok: false, erro: payload.erro };
  }
  if (!payload.required_epis.length) return { ok: false, erro: "Nenhum EPI obrigatório selecionado." };
  if (emAndamento.has(camera.id)) return { ok: false, erro: "Envio já em andamento." };

  emAndamento.add(camera.id);
  marcar({ status: "pendente", em: new Date().toISOString() });
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  const falha = (erro: string): ResultadoSync => {
    marcar({ status: "falhou", em: new Date().toISOString(), erro });
    return { ok: false, erro };
  };
  try {
    const r = await fetch(`${YOLO_API_URL}/cameras/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camera_id: camera.id, required_epis: payload.required_epis }),
      signal: ac.signal,
    });
    if (r.status === 404 || r.status === 405)
      return falha("O servidor YOLO não tem a rota /cameras/config. Atualize o server.py.");
    if (!r.ok) return falha(`Servidor YOLO respondeu HTTP ${r.status}.`);
    const j = (await r.json().catch(() => null)) as { ok?: boolean; camera_id?: string } | null;
    if (!j?.ok || j.camera_id !== camera.id) return falha("Servidor YOLO não confirmou a configuração.");
    marcar({ status: "enviado", em: new Date().toISOString(), enviados: payload.required_epis });
    return { ok: true };
  } catch (e) {
    return falha(
      (e as Error).name === "AbortError"
        ? "Tempo esgotado ao contactar o servidor YOLO."
        : "Servidor YOLO inacessível (offline ou fora da rede).",
    );
  } finally {
    clearTimeout(t);
    emAndamento.delete(camera.id);
  }
}
