import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { usuarios } from "@/lib/mock-data";

export const Route = createFileRoute("/usuarios")({ component: Usuarios });

const nivelColor: Record<string, string> = {
  "Administrador": "bg-destructive/15 text-destructive border-destructive/30",
  "Supervisor": "bg-primary/15 text-primary border-primary/30",
  "Segurança do Trabalho": "bg-warning/15 text-warning border-warning/30",
  "Visualização": "bg-muted text-muted-foreground border-border",
};

function Usuarios() {
  return (
    <AppShell>
      <PageHeader title="Gestão de Usuários" description="Níveis de acesso ao painel administrativo">
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo usuário</Button>
      </PageHeader>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Nível de acesso</TableHead>
              <TableHead>Status</TableHead>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
