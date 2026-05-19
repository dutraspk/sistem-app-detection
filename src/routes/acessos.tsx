import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { acessos } from "@/lib/mock-data";

export const Route = createFileRoute("/acessos")({ component: Acessos });

const periodos = ["Hoje", "Semana", "Mês", "Todos"] as const;

function Acessos() {
  const [q, setQ] = useState("");
  const [per, setPer] = useState<(typeof periodos)[number]>("Hoje");
  const [setor, setSetor] = useState("Todos");

  const setores = useMemo(() => ["Todos", ...Array.from(new Set(acessos.map(a => a.setor)))], []);

  const list = useMemo(() => {
    const now = Date.now();
    const range = per === "Hoje" ? 86400000 : per === "Semana" ? 7 * 86400000 : per === "Mês" ? 30 * 86400000 : Infinity;
    return acessos.filter(a => {
      const inRange = now - new Date(a.data).getTime() <= range;
      const inSetor = setor === "Todos" || a.setor === setor;
      const inQ = a.trabalhador.toLowerCase().includes(q.toLowerCase());
      return inRange && inSetor && inQ;
    });
  }, [q, per, setor]);

  return (
    <AppShell>
      <PageHeader title="Acessos à Área de Risco" description="Registro automatizado de validações da IA por câmera de entrada" />

      <Card className="p-4 bg-card border-border mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar funcionário..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            {periodos.map(p => (
              <button key={p} onClick={() => setPer(p)}
                className={`px-3 py-1.5 rounded-md text-xs border ${per === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                {p}
              </button>
            ))}
          </div>
          <select value={setor} onChange={(e) => setSetor(e.target.value)}
            className="bg-card border border-border rounded-md px-3 py-1.5 text-sm">
            {setores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Trabalhador</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Câmera</TableHead>
              <TableHead>Validação IA</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.id}</TableCell>
                <TableCell className="font-medium">{a.trabalhador}</TableCell>
                <TableCell>{new Date(a.data).toLocaleString("pt-BR")}</TableCell>
                <TableCell>{a.setor}</TableCell>
                <TableCell className="font-mono text-xs">{a.camera}</TableCell>
                <TableCell>
                  {a.validacao === "Liberado"
                    ? <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Liberado</Badge>
                    : <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">Bloqueado</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.motivo ?? "—"}</TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Nenhum acesso encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
