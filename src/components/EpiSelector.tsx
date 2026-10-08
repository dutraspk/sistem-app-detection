import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { externoValido } from "@/lib/epi-mapping";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string[];
  onConfirm: (ids: string[]) => void;
};

export function EpiSelector({ open, onOpenChange, value, onConfirm }: Props) {
  const epis = useStore("epis");
  const [sel, setSel] = useState<Set<string>>(new Set(value));
  useEffect(() => { if (open) setSel(new Set(value)); }, [open, value]);

  const toggle = (id: string) =>
    setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>EPIs obrigatórios para detecção</DialogTitle>
          <DialogDescription>Marque todos os EPIs que esta câmera deve exigir.</DialogDescription>
        </DialogHeader>
        {epis.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center space-y-3">
            <p>Nenhum EPI cadastrado ainda.</p>
            <Button asChild size="sm"><Link to="/epis">Ir para cadastro de EPIs</Link></Button>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto divide-y divide-border border border-border rounded-md">
              {epis.map((e) => (
                <label key={e.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent">
                  <Checkbox checked={sel.has(e.id)} onCheckedChange={() => toggle(e.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{e.categoria}</p>
                  </div>
                  {externoValido(e.external_name)
                    ? <span className="font-mono text-[11px] text-muted-foreground">{e.external_name}</span>
                    : <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">sem nome externo</Badge>}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 min-h-6">
              {sel.size === 0
                ? <span className="text-xs text-muted-foreground">Nenhum selecionado</span>
                : epis.filter((e) => sel.has(e.id)).map((e) => <Badge key={e.id} variant="secondary">{e.nome}</Badge>)}
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { onConfirm(Array.from(sel)); onOpenChange(false); }} disabled={epis.length === 0}>
            Confirmar ({sel.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
