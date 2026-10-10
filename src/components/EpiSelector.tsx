import { useEffect, useMemo, useState } from "react";
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
  /** Categorias selecionadas */
  value: string[];
  onConfirm: (categorias: string[]) => void;
};

export function EpiSelector({ open, onOpenChange, value, onConfirm }: Props) {
  const epis = useStore("epis");
  const categorias = useMemo(() => {
    const m = new Map<string, { total: number; validos: number }>();
    for (const e of epis) {
      const k = e.categoria as string;
      const v = m.get(k) ?? { total: 0, validos: 0 };
      v.total++;
      if (externoValido(e.external_name)) v.validos++;
      m.set(k, v);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [epis]);

  const [sel, setSel] = useState<Set<string>>(new Set(value));
  useEffect(() => { if (open) setSel(new Set(value)); }, [open, value]);

  const toggle = (k: string) =>
    setSel((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>Categorias de EPI obrigatórias</DialogTitle>
          <DialogDescription>Marque as categorias que esta câmera deve exigir.</DialogDescription>
        </DialogHeader>
        {categorias.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center space-y-3">
            <p>Nenhum EPI cadastrado ainda.</p>
            <Button asChild size="sm"><Link to="/epis">Ir para cadastro de EPIs</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {categorias.map(([k, info]) => (
                <label
                  key={k}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${
                    sel.has(k) ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                  }`}
                >
                  <Checkbox checked={sel.has(k)} onCheckedChange={() => toggle(k)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{k}</p>
                    <p className={`text-[11px] ${info.validos ? "text-muted-foreground" : "text-destructive"}`}>
                      {info.total} EPI(s){info.validos < info.total ? ` · ${info.total - info.validos} sem nome externo` : ""}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-1 min-h-6">
              {sel.size === 0
                ? <span className="text-xs text-muted-foreground">Nenhuma selecionada</span>
                : Array.from(sel).map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-center">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { onConfirm(Array.from(sel)); onOpenChange(false); }} disabled={categorias.length === 0}>
            Confirmar ({sel.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
