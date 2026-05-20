import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Plus, Trash2, IdCard } from "lucide-react";
import { useStore, store } from "@/lib/store";

export const Route = createFileRoute("/funcionarios")({ component: Funcionarios });

function Funcionarios() {
  const funcionarios = useStore("funcionarios");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", matricula: "", setor: "", cargo: "" });

  const submit = () => {
    if (!form.nome.trim()) return;
    store.addFuncionario({ ...form, ativo: true });
    setForm({ nome: "", matricula: "", setor: "", cargo: "" });
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader title="Funcionários" description="Cadastro de trabalhadores monitorados pela IA">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo funcionário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar funcionário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome completo</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Matrícula</Label><Input value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} /></div>
              <div><Label>Setor</Label><Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} /></div>
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {funcionarios.length === 0 ? (
        <EmptyState
          icon={IdCard}
          title="Nenhum funcionário cadastrado"
          description="Cadastre os trabalhadores que serão identificados pela IA nas câmeras de entrada e nos setores internos."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Cadastrar primeiro funcionário</Button>}
        />
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell className="font-mono text-xs">{f.matricula || "—"}</TableCell>
                  <TableCell>{f.setor || "—"}</TableCell>
                  <TableCell>{f.cargo || "—"}</TableCell>
                  <TableCell>
                    {f.ativo
                      ? <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Ativo</Badge>
                      : <Badge variant="secondary">Inativo</Badge>}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => store.removeFuncionario(f.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}
