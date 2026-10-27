import { describe, it, expect } from "vitest";
import { resolverEpisCamera } from "./epi-mapping";
import type { Camera, EPI } from "./mock-data";

const cam = (cats: string[]) => ({ id: "CAM-1", categoriasObrigatorias: cats }) as Camera;
const epi = (id: string, categoria: string, external_name?: string) => ({ id, categoria, external_name }) as unknown as EPI;

describe("categorias -> nomes externos", () => {
  it("converte categorias nos nomes externos sem duplicar", () => {
    const epis = [epi("1", "Capacetes", "helmet"), epi("2", "Capacetes", "helmet"), epi("3", "Coletes", "reflective_vest")];
    expect(resolverEpisCamera(cam(["Capacetes", "Coletes"]), epis)).toEqual({ ok: true, required_epis: ["helmet", "reflective_vest"] });
  });
  it("falha se a categoria não tem EPI com nome externo", () => {
    expect(resolverEpisCamera(cam(["Luvas"]), [epi("1", "Luvas")]).ok).toBe(false);
  });
});
