// Mock data for EPI Guard — replace with real API/WebSocket later.
export type EPIStatus = "ativo" | "proximo" | "vencido";
export type EPICategory =
  | "Capacetes" | "Luvas" | "Botas" | "Óculos"
  | "Coletes" | "Protetores auriculares" | "Máscaras" | "Outros";

export interface EPI {
  id: string;
  nome: string;
  categoria: EPICategory;
  cor: string;
  rfid: string;
  validade: string; // ISO date
  status: EPIStatus;
  trabalhador: string;
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

const now = Date.now();
const daysFromNow = (d: number) => new Date(now + d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();

export const epis: EPI[] = [
  { id: "EPI-001", nome: "Capacete Classe B", categoria: "Capacetes", cor: "Amarelo", rfid: "RF-A11023", validade: daysFromNow(120), status: "ativo", trabalhador: "Carlos Silva" },
  { id: "EPI-002", nome: "Luva Nitrílica", categoria: "Luvas", cor: "Azul", rfid: "RF-B20984", validade: daysFromNow(15), status: "proximo", trabalhador: "Marina Souza" },
  { id: "EPI-003", nome: "Bota de Segurança", categoria: "Botas", cor: "Preto", rfid: "RF-C33012", validade: daysFromNow(-5), status: "vencido", trabalhador: "João Pereira" },
  { id: "EPI-004", nome: "Óculos Ampla Visão", categoria: "Óculos", cor: "Transparente", rfid: "RF-D40551", validade: daysFromNow(220), status: "ativo", trabalhador: "Ana Lima" },
  { id: "EPI-005", nome: "Colete Refletivo", categoria: "Coletes", cor: "Laranja", rfid: "RF-E51298", validade: daysFromNow(10), status: "proximo", trabalhador: "Rafael Costa" },
  { id: "EPI-006", nome: "Protetor Auricular", categoria: "Protetores auriculares", cor: "Verde", rfid: "RF-F62847", validade: daysFromNow(180), status: "ativo", trabalhador: "Beatriz Mendes" },
  { id: "EPI-007", nome: "Máscara PFF2", categoria: "Máscaras", cor: "Branco", rfid: "RF-G73512", validade: daysFromNow(7), status: "proximo", trabalhador: "Diego Alves" },
  { id: "EPI-008", nome: "Capacete Classe A", categoria: "Capacetes", cor: "Branco", rfid: "RF-H80021", validade: daysFromNow(300), status: "ativo", trabalhador: "Felipe Ramos" },
];

export const acessos: Acesso[] = [
  { id: "ACS-1001", trabalhador: "Carlos Silva", data: hoursAgo(0.2), setor: "Forno A", camera: "CAM-01", validacao: "Liberado" },
  { id: "ACS-1002", trabalhador: "João Pereira", data: hoursAgo(0.8), setor: "Caldeiraria", camera: "CAM-03", validacao: "Bloqueado", motivo: "Sem capacete" },
  { id: "ACS-1003", trabalhador: "Marina Souza", data: hoursAgo(1.5), setor: "Linha 2", camera: "CAM-02", validacao: "Liberado" },
  { id: "ACS-1004", trabalhador: "Ana Lima", data: hoursAgo(2.4), setor: "Galpão Químicos", camera: "CAM-05", validacao: "Bloqueado", motivo: "Óculos ausente" },
  { id: "ACS-1005", trabalhador: "Rafael Costa", data: hoursAgo(3.1), setor: "Forno A", camera: "CAM-01", validacao: "Liberado" },
  { id: "ACS-1006", trabalhador: "Beatriz Mendes", data: hoursAgo(4.5), setor: "Linha 1", camera: "CAM-04", validacao: "Liberado" },
  { id: "ACS-1007", trabalhador: "Diego Alves", data: hoursAgo(6), setor: "Galpão Químicos", camera: "CAM-05", validacao: "Bloqueado", motivo: "Máscara incorreta" },
];

export const ocorrencias: Ocorrencia[] = [
  { id: "OCR-501", trabalhador: "João Pereira", tipo: "Remoção de capacete", gravidade: "Alta", data: hoursAgo(0.5), local: "Caldeiraria", camera: "CAM-03", status: "Aberta" },
  { id: "OCR-502", trabalhador: "Ana Lima", tipo: "Retirou óculos de proteção", gravidade: "Média", data: hoursAgo(2), local: "Galpão Químicos", camera: "CAM-05", status: "Em análise" },
  { id: "OCR-503", trabalhador: "Diego Alves", tipo: "Máscara incorreta", gravidade: "Crítica", data: hoursAgo(5.6), local: "Galpão Químicos", camera: "CAM-05", status: "Aberta" },
  { id: "OCR-504", trabalhador: "Rafael Costa", tipo: "Sem colete refletivo", gravidade: "Baixa", data: hoursAgo(20), local: "Pátio", camera: "CAM-07", status: "Resolvida", observacoes: "Trabalhador orientado." },
  { id: "OCR-505", trabalhador: "Marina Souza", tipo: "Luva removida", gravidade: "Média", data: hoursAgo(26), local: "Linha 2", camera: "CAM-02", status: "Resolvida" },
];

export const cameras: Camera[] = [
  { id: "CAM-01", nome: "Entrada Forno A", setor: "Forno A", tipo: "Entrada", status: "online", fps: 30 },
  { id: "CAM-02", nome: "Linha 2 - Interna", setor: "Linha 2", tipo: "Interna", status: "online", fps: 25 },
  { id: "CAM-03", nome: "Caldeiraria - Interna", setor: "Caldeiraria", tipo: "Interna", status: "online", fps: 28 },
  { id: "CAM-04", nome: "Linha 1 - Entrada", setor: "Linha 1", tipo: "Entrada", status: "online", fps: 30 },
  { id: "CAM-05", nome: "Químicos - Entrada", setor: "Galpão Químicos", tipo: "Entrada", status: "offline", fps: 0 },
  { id: "CAM-06", nome: "Pátio Externo", setor: "Pátio", tipo: "Interna", status: "online", fps: 24 },
  { id: "CAM-07", nome: "Pátio - Acesso", setor: "Pátio", tipo: "Entrada", status: "online", fps: 30 },
];

export const usuarios: Usuario[] = [
  { id: "USR-1", nome: "Roberto Macedo", email: "roberto@industria.com", nivel: "Administrador", ativo: true },
  { id: "USR-2", nome: "Patrícia Nunes", email: "patricia@industria.com", nivel: "Supervisor", ativo: true },
  { id: "USR-3", nome: "Eng. Tiago Reis", email: "tiago@industria.com", nivel: "Segurança do Trabalho", ativo: true },
  { id: "USR-4", nome: "Visitante Auditoria", email: "audit@industria.com", nivel: "Visualização", ativo: false },
];

export const ocorrenciasPorDia = [
  { dia: "Seg", total: 4 },
  { dia: "Ter", total: 7 },
  { dia: "Qua", total: 3 },
  { dia: "Qui", total: 9 },
  { dia: "Sex", total: 5 },
  { dia: "Sáb", total: 2 },
  { dia: "Dom", total: 1 },
];

export const setoresAlertas = [
  { setor: "Forno A", alertas: 12 },
  { setor: "Caldeiraria", alertas: 18 },
  { setor: "Químicos", alertas: 22 },
  { setor: "Linha 1", alertas: 7 },
  { setor: "Linha 2", alertas: 9 },
  { setor: "Pátio", alertas: 4 },
];

export const usoCorreto = [
  { dia: "Seg", pct: 86 },
  { dia: "Ter", pct: 78 },
  { dia: "Qua", pct: 91 },
  { dia: "Qui", pct: 74 },
  { dia: "Sex", pct: 88 },
  { dia: "Sáb", pct: 95 },
  { dia: "Dom", pct: 97 },
];

export const notificacoes = [
  { id: "N-1", tipo: "Crítico", titulo: "Trabalhador sem capacete", descricao: "João Pereira - Caldeiraria", tempo: "agora" },
  { id: "N-2", tipo: "Alerta", titulo: "Câmera offline", descricao: "CAM-05 - Galpão Químicos", tempo: "5 min" },
  { id: "N-3", tipo: "Aviso", titulo: "EPI próximo do vencimento", descricao: "Máscara PFF2 - Diego Alves", tempo: "1 h" },
  { id: "N-4", tipo: "Info", titulo: "Acesso liberado", descricao: "Carlos Silva - Forno A", tempo: "1 h" },
  { id: "N-5", tipo: "Crítico", titulo: "Tentativa de acesso negada", descricao: "Ana Lima - Químicos", tempo: "2 h" },
];
