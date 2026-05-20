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
import { Plus, Search, HardHat, Trash2 } from "lucide-react";
import { useStore, store } from "@/lib/store";
import { type EPICategory, statusFromValidade } from "@/lib/mock-data";

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
  const epis = useStore("epis");
  const funcionarios = useStore("funcionarios");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof categorias)[number]>("Todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", categoria: "Capacetes" as EPICategory, cor: "", rfid: "",
    validade: "", trabalhador: "—",
  });

  const list = useMemo(() => epis.filter(e => {
    const matchQ = [e.nome, e.trabalhador, e.rfid].join(" ").toLowerCase().includes(q.toLowerCase());
    const matchC = cat === "Todos" || e.categoria === cat;
    return matchQ && matchC;
  }), [q, cat, epis]);

  const submit = () => {
    if (!form.nome.trim() || !form.validade) return;
    store.addEPI(form);
    setForm({ nome: "", categoria: "Capacetes", cor: "", rfid: "", validade: "", trabalhador: "—" });
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader title="Cadastro de EPIs" description="Controle de equipamentos, validade e vínculos com trabalhadores">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo EPI</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar EPI</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Capacete classe B" /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v as EPICategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cor</Label><Input value={form.cor} onChange={e => setForm({ ...form, cor: e.target.value })} /></div>
                <div><Label>RFID</Label><Input value={form.rfid} onChange={e => setForm({ ...form, rfid: e.target.value })} placeholder="RF-XXXXX" /></div>
              </div>
              <div><Label>Validade</Label><Input type="date" value={form.validade} onChange={e => setForm({ ...form, validade: e.target.value })} /></div>
              <div>
                <Label>Trabalhador vinculado</Label>
                <Select value={form.trabalhador} onValueChange={v => setForm({ ...form, trabalhador: v })}>
                  <SelectTrigger><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="—">Sem vínculo</SelectItem>
                    {funcionarios.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                  </SelectContent>
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

      {epis.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="Nenhum EPI cadastrado"
          description="Adicione os equipamentos de proteção controlados pelo sistema (capacetes, luvas, óculos etc.) com RFID e validade."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Cadastrar primeiro EPI</Button>}
        />
      ) : (
        <>
          <Card className="p-4 bg-card border-border mb-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, trabalhador ou RFID..." className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-2">
                {categorias.map(c => (
                  <button key={c} onClick={() => setCat(c)}
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
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{e.id}</TableCell>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.categoria}</TableCell>
                    <TableCell>{e.cor || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{e.rfid || "—"}</TableCell>
                    <TableCell>{new Date(e.validade).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{e.trabalhador}</TableCell>
                    <TableCell>{statusBadge(statusFromValidade(e.validade))}</TableCell>
                    <TableCell>
                      <button onClick={() => store.removeEPI(e.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">Nenhum EPI encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </AppShell>
  );
}
