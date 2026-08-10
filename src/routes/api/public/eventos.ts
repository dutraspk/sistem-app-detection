import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

const eventoSchema = z.object({
  camera: z.string().min(1).max(120),
  setor: z.string().max(120).optional(),
  trabalhador: z.string().max(120).optional(),
  validacao: z.enum(["Liberado", "Bloqueado"]).optional(),
  epis_detectados: z.array(z.string().max(60)).max(30).optional(),
  epis_faltando: z.array(z.string().max(60)).max(30).optional(),
  confianca: z.number().min(0).max(1).optional(),
  ocorreu_em: z.string().datetime().optional(),
  // JPEG/PNG do frame em base64 (com ou sem prefixo data:)
  frame_base64: z.string().max(8_000_000).optional(),
});

export const Route = createFileRoute("/api/public/eventos")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        const expected = process.env["EPI_INGEST_KEY"];
        if (!expected) return json({ error: "Servidor sem EPI_INGEST_KEY configurada" }, 500);
        if (request.headers.get("x-api-key") !== expected) {
          return json({ error: "Chave inválida" }, 401);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "JSON inválido" }, 400);
        }

        const parsed = eventoSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Payload inválido", detalhes: parsed.error.issues }, 400);
        }
        const ev = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let frameUrl: string | null = null;
        if (ev.frame_base64) {
          try {
            const b64 = ev.frame_base64.replace(/^data:image\/\w+;base64,/, "");
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
            const up = await supabaseAdmin.storage
              .from("frames")
              .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
            if (!up.error) {
              const signed = await supabaseAdmin.storage
                .from("frames")
                .createSignedUrl(path, 60 * 60 * 24 * 3650);
              frameUrl = signed.data?.signedUrl ?? null;
            } else {
              console.error("Falha ao subir frame:", up.error.message);
            }
          } catch (e) {
            console.error("Frame base64 inválido:", e);
          }
        }

        const faltando = ev.epis_faltando ?? [];
        const { data, error } = await supabaseAdmin
          .from("deteccoes")
          .insert({
            camera: ev.camera,
            setor: ev.setor ?? null,
            trabalhador: ev.trabalhador ?? null,
            validacao: ev.validacao ?? (faltando.length > 0 ? "Bloqueado" : "Liberado"),
            epis_detectados: ev.epis_detectados ?? [],
            epis_faltando: faltando,
            confianca: ev.confianca ?? null,
            frame_url: frameUrl,
            ocorreu_em: ev.ocorreu_em ?? new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) {
          console.error("Erro ao gravar detecção:", error.message);
          return json({ error: error.message }, 500);
        }

        return json({ ok: true, id: data.id, frame_url: frameUrl }, 201);
      },
    },
  },
});
