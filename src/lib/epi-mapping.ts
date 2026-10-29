// Mapeamento centralizado: EPI cadastrado (id interno) -> nome externo usado pela YOLO.
// Fonte de verdade: cadastro de EPIs (store). Nunca usa o nome exibido como identificador.
import type { Camera, EPI } from "./mock-data";

const EXTERNO_RE = /^[a-z0-9_\-]{1,60}$/;

export function normalizarExterno(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, "_");
}

export function externoValido(v?: string): boolean {
  return !!v && EXTERNO_RE.test(v);
}

/** Representação JSON do mapeamento (derivada, não é armazenamento principal). */
export function gerarMapeamento(epis: EPI[]) {
  return {
    epi_mapping: Object.fromEntries(
      epis.map((e) => [e.id, { display_name: e.nome, external_name: e.external_name ?? null }]),
    ),
  };
}

/** EPIs cujo external_name está ausente ou fora do formato aceito (ex.: "helmet"). */
export function episSemMapeamento(epis: EPI[]): EPI[] {
  return epis.filter((e) => !externoValido(e.external_name));
}

const nomes = (l: EPI[]) => l.map((e) => `"${e.nome}"${e.external_name ? ` (atual: "${e.external_name}")` : " (vazio)"}`).join(", ");

export type PayloadEpis =
  | { ok: true; required_epis: string[] }
  | { ok: false; erro: string };

/** Resolve os EPIs obrigatórios de UMA câmera para os nomes externos. */
export function resolverEpisCamera(camera: Camera, epis: EPI[]): PayloadEpis {
  const out: string[] = [];
  const cats = camera.categoriasObrigatorias ?? [];
  if (cats.length) {
    for (const cat of cats) {
      const doCat = epis.filter((e) => e.categoria === cat);
      if (!doCat.length) return { ok: false, erro: `Categoria "${cat}" sem EPIs cadastrados. Revise a câmera.` };
      const validos = doCat.filter((e) => externoValido(e.external_name));
      if (!validos.length)
        return {
          ok: false,
          erro: `Categoria "${cat}" sem nome externo (classe YOLO) válido. Corrija em EPIs: ${nomes(episSemMapeamento(doCat))}.`,
        };
      validos.forEach((e) => out.push(e.external_name!));
    }
    return { ok: true, required_epis: Array.from(new Set(out)) };
  }
  const ids = Array.from(new Set(camera.episObrigatorios ?? []));
  for (const id of ids) {
    const epi = epis.find((e) => e.id === id);
    if (!epi) return { ok: false, erro: `EPI obrigatório removido do cadastro (id ${id}). Revise a câmera.` };
    if (!externoValido(epi.external_name))
      return { ok: false, erro: `EPI sem nome externo (classe YOLO) válido. Corrija em EPIs: ${nomes([epi])}.` };
    out.push(epi.external_name!);
  }
  return { ok: true, required_epis: Array.from(new Set(out)) };
}
