// Interpretação do estado do servidor YOLO, separada dos erros de configuração de EPIs.
export type EstadoYolo = "inacessivel" | "modelo_indisponivel" | "pronto";

export type StatusYolo = {
  /** true somente quando o servidor está pronto para detectar. */
  online: boolean;
  estado: EstadoYolo | null;
  /** Erro de conectividade/disponibilidade (nunca de configuração). */
  erro: string | null;
  /** Erro de configuração dos EPIs da câmera (não afeta a conectividade). */
  configErro: string | null;
};

export const MSG_INACESSIVEL = "Servidor YOLO inacessível — verifique se o server.py está rodando e o Tailscale conectado";
export const MSG_SEM_MODELO = "Servidor YOLO acessível, mas o modelo não está carregado";

/** Converte a resposta de GET /health em estado. `null` = falha de rede. */
export function interpretarHealth(resp: { httpOk: boolean; json: unknown } | null): { estado: EstadoYolo; erro: string | null } {
  if (!resp) return { estado: "inacessivel", erro: MSG_INACESSIVEL };
  const j = resp.json as { ok?: unknown } | null;
  if (!resp.httpOk || !j || typeof j !== "object") {
    return { estado: "modelo_indisponivel", erro: `${MSG_SEM_MODELO} (resposta inválida de /health)` };
  }
  if (j.ok !== true) return { estado: "modelo_indisponivel", erro: MSG_SEM_MODELO };
  return { estado: "pronto", erro: null };
}

export function statusDe(estado: EstadoYolo | null, erro: string | null, configErro: string | null): StatusYolo {
  return { online: estado === "pronto", estado, erro, configErro };
}
