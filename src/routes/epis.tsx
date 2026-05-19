import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Plus, Search, Download } from "lucide-react";
import { epis, type EPICategory } from "@/lib/mock-data";

export const Route = createFileRoute("/epis")({ component: EPIs });

const categorias: ("Todos" | EPICategory)[] = [
  "Todos", "Capacetes", "Luvas", "Botas", "Óculos", "Coletes",
  "Protetores auriculares", "Máscaras", "Outros",
];

function statusBadge(s: string) {
  if (s === "ativo")
    return <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Ativo</Badge>;
  if (s === "proximo")
    return <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15">Próx. vencimento</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">Vencido</Badge>;
}

function EPIs() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof categorias)[number]>("Todos");

  const list = useMemo(() => epis.filter(e => {
    const matchQ = [e.nome, e.trabalhador, e.rfid].join(" ").toLowerCase().includes(q.toLowerCase());
    const matchC = cat === "Todos" || e.categoria === cat;
    return matchQ && matchC;
  }), [q, cat]);

  return (
    <AppShell>
      <PageHeader title="Cadastro de EPIs" description="Controle de equipamentos, validade e vínculos com trabalhadores">
        <Button variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo EPI</Button>
      </PageHeader>

      <Card className="p-4 bg-card border-border mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, trabalhador ou RFID..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                  cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>RFID</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Trabalhador</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{e.id}</TableCell>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell>{e.categoria}</TableCell>
                <TableCell>{e.cor}</TableCell>
                <TableCell className="font-mono text-xs">{e.rfid}</TableCell>
                <TableCell>{new Date(e.validade).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{e.trabalhador}</TableCell>
                <TableCell>{statusBadge(e.status)}</TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Nenhum EPI encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
