import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Plus, Users as UsersIcon, Trash2 } from "lucide-react";
import { useStore, store } from "@/lib/store";
import type { Usuario } from "@/lib/mock-data";

export const Route = createFileRoute("/usuarios")({ component: Usuarios });

const niveis: Usuario["nivel"][] = ["Administrador", "Supervisor", "Segurança do Trabalho", "Visualização"];

const nivelColor: Record<string, string> = {
  "Administrador": "bg-destructive/15 text-destructive border-destructive/30",
  "Supervisor": "bg-primary/15 text-primary border-primary/30",
  "Segurança do Trabalho": "bg-warning/15 text-warning border-warning/30",
  "Visualização": "bg-muted text-muted-foreground border-border",
};

function Usuarios() {
  const usuarios = useStore("usuarios");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", nivel: "Administrador" as Usuario["nivel"] });

  const submit = () => {
    if (!form.nome.trim() || !form.email.trim()) return;
    store.addUsuario({ ...form, ativo: true });
    setForm({ nome: "", email: "", nivel: "Administrador" });
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader title="Gestão de Usuários" description="Níveis de acesso ao painel administrativo">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label>Nível de acesso</Label>
                <Select value={form.nivel} onValueChange={v => setForm({ ...form, nivel: v as Usuario["nivel"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{niveis.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {usuarios.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum usuário cadastrado"
          description="Cadastre os operadores que terão acesso ao painel: administradores, supervisores e equipe de segurança do trabalho."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Cadastrar primeiro usuário</Button>}
        />
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível de acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center text-xs font-medium">
                        {u.nome.split(" ").map(p => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium">{u.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><Badge className={`${nivelColor[u.nivel]} hover:opacity-100`}>{u.nivel}</Badge></TableCell>
                  <TableCell>
                    {u.ativo
                      ? <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Ativo</Badge>
                      : <Badge variant="secondary">Inativo</Badge>}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => store.removeUsuario(u.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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
