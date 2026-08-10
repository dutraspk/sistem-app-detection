import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, AlertTriangle, Clock, Cctv, IdCard, HardHat, ArrowRight, ShieldCheck, ScanEye,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { statusFromValidade } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Dashboard });

type DeteccaoLive = {
  id: string;
  camera: string;
  setor: string | null;
  validacao: string;
  epis_faltando: string[];
  frame_url: string | null;
  ocorreu_em: string;
};

function useDeteccoesLive(limite = 6) {
  const [itens, setItens] = useState<DeteccaoLive[]>([]);

  useEffect(() => {
    let ativo = true;
    supabase
      .from("deteccoes")
      .select("id,camera,setor,validacao,epis_faltando,frame_url,ocorreu_em")
      .order("ocorreu_em", { ascending: false })
      .limit(limite)
      .then(({ data }) => {
        if (ativo) setItens((data ?? []) as DeteccaoLive[]);
      });

    const channel = supabase
      .channel("dashboard-deteccoes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deteccoes" },
        (payload) => setItens((prev) => [payload.new as DeteccaoLive, ...prev].slice(0, limite)),
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [limite]);

  return itens;
}


function Stat({ icon: Icon, label, value, trend, tone = "primary" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; trend?: string;
  tone?: "primary" | "destructive" | "success" | "warning";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/15 text-primary ring-primary/30",
    destructive: "bg-destructive/15 text-destructive ring-destructive/30",
    success: "bg-success/15 text-success ring-success/30",
    warning: "bg-warning/15 text-warning ring-warning/30",
  };
  return (
    <Card className="p-5 bg-card border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold mt-2 tracking-tight">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ring-1 ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function SetupCard({ icon: Icon, title, desc, to, done }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; to: string; done: boolean;
}) {
  return (
    <Link to={to} className="block">
      <Card className="p-5 bg-card border-border hover:border-primary/40 transition-colors h-full">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ring-1 ${done ? "bg-success/15 text-success ring-success/30" : "bg-primary/15 text-primary ring-primary/30"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">{title}</p>
              {done && <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">OK</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}

function Dashboard() {
  const funcionarios = useStore("funcionarios");
  const epis = useStore("epis");
  const ocorrencias = useStore("ocorrencias");
  const cameras = useStore("cameras");
  const usuarios = useStore("usuarios");
  const deteccoes = useDeteccoesLive(6);

  const ocorrenciasHoje = ocorrencias.filter(o => Date.now() - new Date(o.data).getTime() < 86400000).length;
  const episVencer = epis.filter(e => {
    const s = statusFromValidade(e.validade);
    return s === "proximo" || s === "vencido";
  }).length;
  const onlineCams = cameras.filter(c => c.status === "online").length;

  const empty = funcionarios.length === 0 && epis.length === 0 && cameras.length === 0;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Operacional"
        description="Visão em tempo real da fiscalização de EPI por IA YOLOv4"
      >
        <Badge className={cameras.some(c => c.status === "online")
          ? "bg-success/15 text-success border-success/30 hover:bg-success/15"
          : "bg-muted text-muted-foreground border-border"}>
          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${cameras.some(c => c.status === "online") ? "bg-success live-dot" : "bg-muted-foreground"}`} />
          {cameras.some(c => c.status === "online") ? "Ao vivo" : "Aguardando"}
        </Badge>
      </PageHeader>

      {empty && (
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/30 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Bem-vindo ao EPI Guard</p>
              <p className="text-sm text-muted-foreground mt-1">
                Configure seu ambiente em 3 passos: cadastre funcionários, registre os EPIs e conecte as câmeras do Raspberry Pi.
              </p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Link to="/funcionarios"><Button size="sm">Começar pelos funcionários</Button></Link>
                <Link to="/cameras"><Button size="sm" variant="secondary">Conectar câmera</Button></Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Funcionários" value={funcionarios.length} tone="primary" />
        <Stat icon={AlertTriangle} label="Ocorrências hoje" value={ocorrenciasHoje} tone="destructive" />
        <Stat icon={Clock} label="EPIs a vencer" value={episVencer} tone="warning" />
        <Stat icon={Cctv} label="Câmeras online" value={`${onlineCams}/${cameras.length}`} tone="success" />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium mb-3">Configuração do sistema</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <SetupCard icon={IdCard} title="Cadastrar funcionários" desc="Pessoas monitoradas pela IA" to="/funcionarios" done={funcionarios.length > 0} />
          <SetupCard icon={HardHat} title="Cadastrar EPIs" desc="Equipamentos e validade" to="/epis" done={epis.length > 0} />
          <SetupCard icon={Cctv} title="Conectar câmeras" desc="Streams RTSP do Raspberry Pi" to="/cameras" done={cameras.length > 0} />
          <SetupCard icon={Users} title="Adicionar usuários do painel" desc="Permissões de acesso" to="/usuarios" done={usuarios.length > 0} />
          <SetupCard icon={AlertTriangle} title="Acompanhar ocorrências" desc="Eventos detectados pela IA" to="/ocorrencias" done={ocorrencias.length > 0} />
        </div>
      </div>

      {deteccoes.length > 0 && (
        <Card className="p-5 bg-card border-border mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-primary" /> Detecções da IA ao vivo
            </p>
            <Link to="/deteccoes" className="text-xs text-primary hover:underline">Ver tudo</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deteccoes.map(d => (
              <div key={d.id} className="rounded-lg border border-border overflow-hidden bg-secondary/40">
                <div className="aspect-video bg-secondary flex items-center justify-center">
                  {d.frame_url ? (
                    <img src={d.frame_url} alt={`Frame da câmera ${d.camera}`} loading="lazy"
                      className="w-full h-full object-cover" />
                  ) : <ScanEye className="w-8 h-8 text-muted-foreground" />}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate">{d.camera}{d.setor ? ` · ${d.setor}` : ""}</p>
                    <Badge className={d.validacao === "Bloqueado"
                      ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15"
                      : "bg-success/15 text-success border-success/30 hover:bg-success/15"}>
                      {d.validacao}
                    </Badge>
                  </div>
                  {d.epis_faltando.length > 0 && (
                    <p className="text-[11px] text-destructive mt-1">Faltando: {d.epis_faltando.join(", ")}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(d.ocorreu_em).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}


      {ocorrencias.length > 0 && (
        <Card className="p-5 bg-card border-border mt-6">
          <p className="font-medium mb-4">Últimas ocorrências</p>
          <ul className="space-y-3">
            {ocorrencias.slice(0, 5).map(o => (
              <li key={o.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className={`mt-1 w-2 h-2 rounded-full ${
                  o.gravidade === "Crítica" || o.gravidade === "Alta" ? "bg-destructive live-dot" :
                  o.gravidade === "Média" ? "bg-warning" : "bg-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.tipo}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.trabalhador} · {o.local}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(o.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
