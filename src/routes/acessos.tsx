import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Search, Plus, DoorOpen } from "lucide-react";
import { useStore, store } from "@/lib/store";

export const Route = createFileRoute("/acessos")({ component: Acessos });

const periodos = ["Hoje", "Semana", "Mês", "Todos"] as const;

function Acessos() {
  const acessos = useStore("acessos");
  const funcionarios = useStore("funcionarios");
  const cameras = useStore("cameras");
  const [q, setQ] = useState("");
  const [per, setPer] = useState<(typeof periodos)[number]>("Todos");
  const [setor, setSetor] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    trabalhador: "", setor: "", camera: "",
    validacao: "Liberado" as "Liberado" | "Bloqueado", motivo: "",
  });

  const setores = useMemo(() => ["Todos", ...Array.from(new Set(acessos.map(a => a.setor)))], [acessos]);

  const list = useMemo(() => {
    const now = Date.now();
    const range = per === "Hoje" ? 86400000 : per === "Semana" ? 7 * 86400000 : per === "Mês" ? 30 * 86400000 : Infinity;
    return acessos.filter(a => {
      const inRange = now - new Date(a.data).getTime() <= range;
      const inSetor = setor === "Todos" || a.setor === setor;
      const inQ = a.trabalhador.toLowerCase().includes(q.toLowerCase());
      return inRange && inSetor && inQ;
    });
  }, [q, per, setor, acessos]);

  const submit = () => {
    if (!form.trabalhador || !form.setor) return;
    store.addAcesso({
      ...form,
      data: new Date().toISOString(),
      motivo: form.validacao === "Bloqueado" ? form.motivo : undefined,
    });
    setForm({ trabalhador: "", setor: "", camera: "", validacao: "Liberado", motivo: "" });
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader title="Acessos à Área de Risco" description="Registro de validações da IA por câmera de entrada">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Registrar acesso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar acesso manual</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Trabalhador</Label>
                <Select value={form.trabalhador} onValueChange={v => setForm({ ...form, trabalhador: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>{funcionarios.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Setor</Label><Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} /></div>
              <div>
                <Label>Câmera</Label>
                <Select value={form.camera} onValueChange={v => setForm({ ...form, camera: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>{cameras.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Validação</Label>
                <Select value={form.validacao} onValueChange={v => setForm({ ...form, validacao: v as "Liberado" | "Bloqueado" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Liberado">Liberado</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.validacao === "Bloqueado" && (
                <div><Label>Motivo</Label><Input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {acessos.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="Nenhum acesso registrado"
          description="Os acessos serão registrados automaticamente quando a IA das câmeras de entrada validar EPIs. Você também pode registrar manualmente."
          action={<Button onClick={() => setOpen(true)} disabled={funcionarios.length === 0}>
            <Plus className="w-4 h-4 mr-2" />{funcionarios.length === 0 ? "Cadastre um funcionário primeiro" : "Registrar acesso"}
          </Button>}
        />
      ) : (
        <>
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
        </>
      )}
    </AppShell>
  );
}
