// Tipos compartilhados do EPI Guard. Os dados são gerenciados em src/lib/store.ts
// (persistidos em localStorage) — o app inicia vazio e tudo é cadastrado pelo usuário.

export type EPIStatus = "ativo" | "proximo" | "vencido";
export type EPICategory =
  | "Capacetes" | "Luvas" | "Botas" | "Óculos"
  | "Coletes" | "Protetores auriculares" | "Máscaras" | "Outros";

export interface Funcionario {
  id: string;
  nome: string;
  matricula: string;
  setor: string;
  cargo: string;
  ativo: boolean;
}

export interface EPI {
  id: string;
  nome: string;
  categoria: EPICategory;
  cor: string;
  rfid: string;
  validade: string; // ISO date
  trabalhador: string; // nome ou "—"
}

export interface Acesso {
  id: string;
  trabalhador: string;
  data: string;
  setor: string;
  camera: string;
  validacao: "Liberado" | "Bloqueado";
  motivo?: string;
}

export interface Ocorrencia {
  id: string;
  trabalhador: string;
  tipo: string;
  gravidade: "Baixa" | "Média" | "Alta" | "Crítica";
  data: string;
  local: string;
  camera: string;
  status: "Aberta" | "Em análise" | "Resolvida";
  observacoes?: string;
}

export interface Camera {
  id: string;
  nome: string;
  setor: string;
  tipo: "Entrada" | "Interna";
  area?: "Risco" | "Segura";
  url: string;       // RTSP/HTTP do stream (ex.: rtsp://raspberrypi.local:8554/cam)
  status: "online" | "offline";
  fps: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel: "Administrador" | "Supervisor" | "Segurança do Trabalho" | "Visualização";
  ativo: boolean;
}

export interface Notificacao {
  id: string;
  tipo: "Crítico" | "Alerta" | "Aviso" | "Info";
  titulo: string;
  descricao: string;
  data: string;
}

export function statusFromValidade(validade: string): EPIStatus {
  const diff = (new Date(validade).getTime() - Date.now()) / 86400000;
  if (diff < 0) return "vencido";
  if (diff < 30) return "proximo";
  return "ativo";
}
