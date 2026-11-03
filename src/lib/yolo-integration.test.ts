import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { interpretarHealth, statusDe } from "./yolo-health";
import { resolverEpisCamera, episSemMapeamento } from "./epi-mapping";
import { salvarEdicaoCamera } from "./camera-edit";
import { enviarConfigCamera } from "./camera-config-sync";
import { store } from "./store";
import type { Camera, EPI } from "./mock-data";

describe("estado da YOLO", () => {
  it("falha de rede = servidor inacessível", () => {
    expect(interpretarHealth(null).estado).toBe("inacessivel");
  });
  it("health com ok:false = modelo indisponível", () => {
    expect(interpretarHealth({ httpOk: true, json: { ok: false } }).estado).toBe("modelo_indisponivel");
  });
  it("HTTP 200 sem JSON válido não conta como pronto", () => {
    expect(interpretarHealth({ httpOk: true, json: null }).estado).toBe("modelo_indisponivel");
  });
  it("health com ok:true = pronto", () => {
    expect(interpretarHealth({ httpOk: true, json: { ok: true } })).toEqual({ estado: "pronto", erro: null });
  });
  it("erro de configuração não marca a YOLO como offline", () => {
    const s = statusDe("pronto", null, "Categoria sem nome externo");
    expect(s.online).toBe(true);
    expect(s.configErro).toBe("Categoria sem nome externo");
  });
});

describe("EPIs sem nome externo", () => {
  const epis = [
    { id: "1", nome: "Capacete Azul", categoria: "Capacetes", external_name: "" },
    { id: "2", nome: "Capacete Branco", categoria: "Capacetes", external_name: "Capacete" },
  ] as unknown as EPI[];
  it("lista os EPIs inválidos", () => {
    expect(episSemMapeamento(epis).map((e) => e.nome)).toEqual(["Capacete Azul", "Capacete Branco"]);
  });
  it("mensagem cita os nomes e não usa o nome exibido como classe", () => {
    const r = resolverEpisCamera({ id: "C", categoriasObrigatorias: ["Capacetes"] } as Camera, epis);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toContain("Capacete Azul");
      expect(r.erro).toContain("Capacete Branco");
    }
  });
});

describe("edição de câmera + sincronização", () => {
  const fetchMock = vi.fn();
  let cam: Camera;
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    store.get().cameras.forEach((c) => store.removeCamera(c.id));
    store.get().epis.forEach((e) => store.removeEPI(e.id));
    store.addEPI({ nome: "Capacete", categoria: "Capacetes", cor: "", rfid: "", validade: "2030-01-01", trabalhador: "—", external_name: "helmet" });
    store.addEPI({ nome: "Colete", categoria: "Coletes", cor: "", rfid: "", validade: "2030-01-01", trabalhador: "—", external_name: "vest" });
    cam = store.addCamera({ nome: "Entrada", setor: "Forno", tipo: "Entrada", area: "Segura", url: "device:abc", status: "online", fps: 30, categoriasObrigatorias: ["Capacetes"] });
  });
  afterEach(() => vi.unstubAllGlobals());

  const dados = () => ({ nome: "Entrada Nova", setor: "Forno", tipo: "Entrada" as const, area: "Risco" as const, url: "device:abc", fps: 30, categoriasObrigatorias: ["Capacetes", "Coletes"] });

  it("edita dados e categorias preservando id e campos não editados, e envia a nova config", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, camera_id: cam.id }), { status: 200 }));
    const r = await salvarEdicaoCamera(cam.id, dados());
    expect(r).toEqual({ salvo: true, sync: { ok: true } });
    const lista = store.get().cameras;
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe(cam.id);
    expect(lista[0].nome).toBe("Entrada Nova");
    expect(lista[0].area).toBe("Risco");
    expect(lista[0].status).toBe("online");
    expect(lista[0].categoriasObrigatorias).toEqual(["Capacetes", "Coletes"]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/cameras\/config$/);
    expect(JSON.parse(init.body)).toEqual({ camera_id: cam.id, required_epis: ["helmet", "vest"] });
    expect(lista[0].syncYolo?.status).toBe("enviado");
  });

  it("falha de sincronização mantém a câmera salva, sem duplicar", async () => {
    fetchMock.mockRejectedValue(new TypeError("network"));
    const r = await salvarEdicaoCamera(cam.id, dados());
    expect(r.salvo).toBe(true);
    if (r.salvo) expect(r.sync?.ok).toBe(false);
    const lista = store.get().cameras;
    expect(lista).toHaveLength(1);
    expect(lista[0].nome).toBe("Entrada Nova");
    expect(lista[0].syncYolo?.status).toBe("falhou");
  });

  it("dados inválidos não são salvos nem enviados", async () => {
    const r = await salvarEdicaoCamera(cam.id, { ...dados(), nome: "  " });
    expect(r.salvo).toBe(false);
    expect(store.get().cameras[0].nome).toBe("Entrada");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resposta sem confirmação do servidor não conta como sincronizado", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, camera_id: "outra" }), { status: 200 }));
    expect((await enviarConfigCamera(store.get().cameras[0], store.getEpis())).ok).toBe(false);
  });
});
