// Edição de câmera: valida, persiste (mesmo id) e depois sincroniza os EPIs com a YOLO.
import type { Camera } from "./mock-data";
import { store } from "./store";
import { enviarConfigCamera, type ResultadoSync } from "./camera-config-sync";

export type CamposEditaveis = Pick<Camera, "nome" | "setor" | "tipo" | "area" | "url" | "fps" | "categoriasObrigatorias">;

export function validarCamera(d: Partial<CamposEditaveis>): string | null {
  if (!d.url) return "Selecione a câmera conectada.";
  if (!d.nome?.trim()) return "Informe o nome da câmera.";
  if (d.tipo !== "Entrada" && d.tipo !== "Interna") return "Tipo inválido.";
  if (d.area !== "Risco" && d.area !== "Segura") return "Classificação da área inválida.";
  if (d.fps !== undefined && (!Number.isFinite(d.fps) || d.fps <= 0)) return "FPS inválido.";
  return null;
}

export type ResultadoEdicao =
  | { salvo: false; erro: string }
  | { salvo: true; sync: ResultadoSync | null };

export async function salvarEdicaoCamera(
  id: string,
  dados: CamposEditaveis,
  enviar: typeof enviarConfigCamera = enviarConfigCamera,
): Promise<ResultadoEdicao> {
  const atual = store.get().cameras.find((c) => c.id === id);
  if (!atual) return { salvo: false, erro: "Câmera não encontrada." };
  const erro = validarCamera(dados);
  if (erro) return { salvo: false, erro };

  const patch: Partial<Camera> = {
    nome: dados.nome.trim(),
    setor: dados.setor ?? "",
    tipo: dados.tipo,
    area: dados.area,
    url: dados.url,
    fps: dados.fps,
    categoriasObrigatorias: dados.categoriasObrigatorias ?? [],
    episObrigatorios: [],
  };
  try {
    store.updateCamera(id, patch);
  } catch (e) {
    return { salvo: false, erro: `Falha ao salvar: ${(e as Error).message}` };
  }
  const salva = store.get().cameras.find((c) => c.id === id);
  if (!salva || salva.nome !== patch.nome || salva.url !== patch.url)
    return { salvo: false, erro: "As alterações não foram gravadas." };

  if (!salva.categoriasObrigatorias?.length) return { salvo: true, sync: null };
  return { salvo: true, sync: await enviar(salva, store.getEpis()) };
}
