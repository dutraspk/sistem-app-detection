import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  camera: z.string().min(1).max(120),
  setor: z.string().max(120).optional(),
  epis_obrigatorios: z.array(z.string().max(60)).max(20).default([]),
  frame_base64: z.string().max(8_000_000),
});

type Analise = {
  pessoa: boolean;
  epis_detectados: string[];
  epis_faltando: string[];
  confianca: number;
};

export const analisarFrame = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponível: chave não configurada");

    const obrig = data.epis_obrigatorios.length
      ? data.epis_obrigatorios
      : ["capacete", "oculos", "luva", "bota", "colete"];

    const b64 = data.frame_base64.startsWith("data:")
      ? data.frame_base64
      : `data:image/jpeg;base64,${data.frame_base64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um fiscal de segurança do trabalho analisando um frame de câmera industrial. " +
              "Responda SOMENTE com JSON válido no formato " +
              '{"pessoa":boolean,"epis_detectados":string[],"epis_faltando":string[],"confianca":number}. ' +
              `Considere obrigatórios: ${obrig.join(", ")}. Use exatamente esses nomes. confianca entre 0 e 1.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise a imagem e liste os EPIs presentes e ausentes na pessoa." },
              { type: "image_url", image_url: { url: b64 } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Falha na IA (${res.status}): ${txt.slice(0, 200)}`);
    }

    const out = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = out.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return { gravado: false as const, motivo: "resposta-invalida" };

    let analise: Analise;
    try {
      analise = JSON.parse(match[0]) as Analise;
    } catch {
      return { gravado: false as const, motivo: "json-invalido" };
    }

    if (!analise.pessoa) return { gravado: false as const, motivo: "sem-pessoa" };

    const faltando = Array.isArray(analise.epis_faltando) ? analise.epis_faltando : [];
    const detectados = Array.isArray(analise.epis_detectados) ? analise.epis_detectados : [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let frameUrl: string | null = null;
    try {
      const puro = b64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(puro), (c) => c.charCodeAt(0));
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
      const up = await supabaseAdmin.storage
        .from("frames")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
      if (!up.error) {
        const signed = await supabaseAdmin.storage
          .from("frames")
          .createSignedUrl(path, 60 * 60 * 24 * 3650);
        frameUrl = signed.data?.signedUrl ?? null;
      }
    } catch {
      frameUrl = null;
    }

    const { data: row, error } = await supabaseAdmin
      .from("deteccoes")
      .insert({
        camera: data.camera,
        setor: data.setor ?? null,
        trabalhador: null,
        validacao: faltando.length > 0 ? "Bloqueado" : "Liberado",
        epis_detectados: detectados,
        epis_faltando: faltando,
        confianca: typeof analise.confianca === "number" ? analise.confianca : null,
        frame_url: frameUrl,
        ocorreu_em: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return {
      gravado: true as const,
      id: row.id,
      validacao: faltando.length > 0 ? "Bloqueado" : "Liberado",
      epis_faltando: faltando,
    };
  });
