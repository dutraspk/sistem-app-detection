import { describe, it, expect, afterEach, vi } from "vitest";
import { Route } from "./eventos";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers = (Route.options as any).server.handlers;
const post = (headers: Record<string, string>, body = "{}") =>
  handlers.POST({ request: new Request("http://x/api/public/eventos", { method: "POST", headers, body }) });

describe("POST /api/public/eventos", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("sem EPI_INGEST_KEY configurada responde 500", async () => {
    vi.stubEnv("EPI_INGEST_KEY", "");
    expect((await post({ "x-api-key": "a" })).status).toBe(500);
  });
  it("sem x-api-key responde 401", async () => {
    vi.stubEnv("EPI_INGEST_KEY", "segredo");
    expect((await post({})).status).toBe(401);
  });
  it("chave errada responde 401", async () => {
    vi.stubEnv("EPI_INGEST_KEY", "segredo");
    expect((await post({ "x-api-key": "errada" })).status).toBe(401);
  });
  it("chave certa com payload inválido responde 400", async () => {
    vi.stubEnv("EPI_INGEST_KEY", "segredo");
    expect((await post({ "x-api-key": "segredo" }, JSON.stringify({}))).status).toBe(400);
  });
  it("OPTIONS responde 204 com CORS permitindo x-api-key", async () => {
    const r = await handlers.OPTIONS();
    expect(r.status).toBe(204);
    expect(r.headers.get("Access-Control-Allow-Headers")).toContain("x-api-key");
  });
});
