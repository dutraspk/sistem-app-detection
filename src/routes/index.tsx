import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, AlertTriangle, Clock, Cctv, TrendingUp, ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, LineChart, Line,
} from "recharts";
import {
  ocorrenciasPorDia, setoresAlertas, usoCorreto, ocorrencias, cameras, epis,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({ component: Dashboard });

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1E293B",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#F8FAFC",
    fontSize: 12,
  },
  labelStyle: { color: "#94A3B8" },
};

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

function Dashboard() {
  const ativos = 47;
  const ocorrenciasHoje = ocorrencias.filter(o => Date.now() - new Date(o.data).getTime() < 86400000).length;
  const episVencer = epis.filter(e => e.status === "proximo" || e.status === "vencido").length;
  const onlineCams = cameras.filter(c => c.status === "online").length;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Operacional"
        description="Visão em tempo real da fiscalização de EPI por IA YOLOv4"
      >
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">
          <span className="w-1.5 h-1.5 rounded-full bg-success mr-2 live-dot" />
          Ao vivo
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Trabalhadores na área" value={ativos} trend="+3 últimas 10 min" tone="primary" />
        <Stat icon={AlertTriangle} label="Ocorrências hoje" value={ocorrenciasHoje} trend="2 críticas" tone="destructive" />
        <Stat icon={Clock} label="EPIs próximos do vencimento" value={episVencer} trend="Ação requerida" tone="warning" />
        <Stat icon={Cctv} label="Câmeras online" value={`${onlineCams}/${cameras.length}`} trend="1 offline" tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Ocorrências por dia</p>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ocorrenciasPorDia}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dia" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Uso correto de EPI</p>
            <ShieldAlert className="w-4 h-4 text-success" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usoCorreto}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dia" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} domain={[60, 100]} />
                <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="pct" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3, fill: "#16A34A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Setores com mais alertas</p>
            <Badge variant="secondary" className="text-xs">7 dias</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={setoresAlertas}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="setor" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="alertas" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border">
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
                <span className="text-[10px] text-muted-foreground">{new Date(o.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
