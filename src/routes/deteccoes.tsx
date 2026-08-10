import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanEye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/deteccoes")({
  component: Deteccoes,
  head: () => ({
    meta: [
      { title: "Detecções da IA em tempo real | EPI Guard" },
      {
        name: "description",
        content:
          "Feed ao vivo das detecções de EPI enviadas pelo modelo YOLO, com foto do frame, EPIs faltando e status de liberação.",
      },
      { property: "og:title", content: "Detecções da IA em tempo real | EPI Guard" },
      {
        property: "og:description",
        content: "Eventos de visão computacional YOLO integrados ao painel EPI Guard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Deteccao = {
  id: string;
  camera: string;
  setor: string | null;
  trabalhador: string | null;
  validacao: string;
  epis_detectados: string[];
  epis_faltando: string[];
  confianca: number | null;
  frame_url: string | null;
  ocorreu_em: string;
};

function Deteccoes() {
  const [itens, setItens] = useState<Deteccao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    supabase
      .from("deteccoes")
      .select("*")
      .order("ocorreu_em", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!ativo) return;
        setItens((data ?? []) as Deteccao[]);
        setCarregando(false);
      });

    const channel = supabase
      .channel("deteccoes-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deteccoes" },
        (payload) => setItens((prev) => [payload.new as Deteccao, ...prev].slice(0, 60)),
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Detecções da IA (YOLO)"
        description="Eventos enviados em tempo real pelo seu detector rodando no PC/servidor"
      />

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando detecções…</p>
      ) : itens.length === 0 ? (
        <EmptyState
          icon={ScanEye}
          title="Nenhuma detecção recebida ainda"
          description="Rode o detector.py no seu PC apontando para /api/public/eventos. Assim que a IA identificar alguém, o evento aparece aqui automaticamente — com a foto do frame."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {itens.map((d) => {
            const bloqueado = d.validacao === "Bloqueado";
            return (
              <Card key={d.id} className="bg-card border-border overflow-hidden">
                <div className="aspect-video bg-secondary flex items-center justify-center">
                  {d.frame_url ? (
                    <img
                      src={d.frame_url}
                      alt={`Frame da câmera ${d.camera} em ${new Date(d.ocorreu_em).toLocaleString("pt-BR")}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ScanEye className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{d.trabalhador ?? "Não identificado"}</p>
                    <Badge
                      className={
                        bloqueado
                          ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15"
                          : "bg-success/15 text-success border-success/30 hover:bg-success/15"
                      }
                    >
                      {d.validacao}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.camera}
                    {d.setor ? ` · ${d.setor}` : ""} ·{" "}
                    {new Date(d.ocorreu_em).toLocaleString("pt-BR")}
                  </p>
                  {d.epis_faltando.length > 0 && (
                    <p className="text-xs text-destructive">
                      Faltando: {d.epis_faltando.join(", ")}
                    </p>
                  )}
                  {d.epis_detectados.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Detectado: {d.epis_detectados.join(", ")}
                    </p>
                  )}
                  {d.confianca != null && (
                    <p className="text-[11px] text-muted-foreground font-mono">
                      confiança {(d.confianca * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
