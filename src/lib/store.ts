import { useSyncExternalStore } from "react";
import type {
  Funcionario, EPI, Acesso, Ocorrencia, Camera, Usuario, Notificacao,
} from "./mock-data";

type StoreShape = {
  funcionarios: Funcionario[];
  epis: EPI[];
  acessos: Acesso[];
  ocorrencias: Ocorrencia[];
  cameras: Camera[];
  usuarios: Usuario[];
  notificacoes: Notificacao[];
};

const KEY = "epi-guard:v1";

const empty: StoreShape = {
  funcionarios: [], epis: [], acessos: [],
  ocorrencias: [], cameras: [], usuarios: [], notificacoes: [],
};

function load(): StoreShape {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

let state: StoreShape = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<K extends keyof StoreShape>(key: K): StoreShape[K] {
  return useSyncExternalStore(
    subscribe,
    () => state[key],
    () => empty[key],
  );
}

export const store = {
  get: () => state,

  addFuncionario(f: Omit<Funcionario, "id">) {
    state = { ...state, funcionarios: [...state.funcionarios, { ...f, id: `FUNC-${Date.now()}` }] };
    persist();
  },
  removeFuncionario(id: string) {
    state = { ...state, funcionarios: state.funcionarios.filter(x => x.id !== id) };
    persist();
  },

  addEPI(e: Omit<EPI, "id">) {
    state = { ...state, epis: [...state.epis, { ...e, id: `EPI-${Date.now()}` }] };
    persist();
  },
  removeEPI(id: string) {
    state = { ...state, epis: state.epis.filter(x => x.id !== id) };
    persist();
  },

  addAcesso(a: Omit<Acesso, "id">) {
    state = { ...state, acessos: [{ ...a, id: `ACS-${Date.now()}` }, ...state.acessos] };
    persist();
  },

  addOcorrencia(o: Omit<Ocorrencia, "id">) {
    state = { ...state, ocorrencias: [{ ...o, id: `OCR-${Date.now()}` }, ...state.ocorrencias] };
    persist();
  },
  updateOcorrencia(id: string, patch: Partial<Ocorrencia>) {
    state = { ...state, ocorrencias: state.ocorrencias.map(o => o.id === id ? { ...o, ...patch } : o) };
    persist();
  },
  removeOcorrencia(id: string) {
    state = { ...state, ocorrencias: state.ocorrencias.filter(x => x.id !== id) };
    persist();
  },

  addCamera(c: Omit<Camera, "id">) {
    state = { ...state, cameras: [...state.cameras, { ...c, id: `CAM-${Date.now()}` }] };
    persist();
  },
  removeCamera(id: string) {
    state = { ...state, cameras: state.cameras.filter(x => x.id !== id) };
    persist();
  },

  addUsuario(u: Omit<Usuario, "id">) {
    state = { ...state, usuarios: [...state.usuarios, { ...u, id: `USR-${Date.now()}` }] };
    persist();
  },
  removeUsuario(id: string) {
    state = { ...state, usuarios: state.usuarios.filter(x => x.id !== id) };
    persist();
  },

  addNotificacao(n: Omit<Notificacao, "id" | "data">) {
    state = {
      ...state,
      notificacoes: [{ ...n, id: `N-${Date.now()}`, data: new Date().toISOString() }, ...state.notificacoes],
    };
    persist();
  },
  clearNotificacoes() {
    state = { ...state, notificacoes: [] };
    persist();
  },
};
