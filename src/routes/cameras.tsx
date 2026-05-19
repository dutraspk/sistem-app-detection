import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera as CamIcon, Wifi, WifiOff } from "lucide-react";
import { cameras } from "@/lib/mock-data";

export const Route = createFileRoute("/cameras")({ component: Cameras });

function Cameras() {
  return (
    <AppShell>
      <PageHeader title="Câmeras com IA (YOLOv4)" description="Monitoramento contínuo de áreas seguras e de risco" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cameras.map(c => {
          const on = c.status === "online";
          return (
            <Card key={c.id} className="bg-card border-border overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-secondary via-card to-background flex items-center justify-center">
                {on ? (
                  <>
                    <CamIcon className="w-12 h-12 text-primary/40" />
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 bg-destructive/90 text-destructive-foreground rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
                      Rec
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-white/70">
                      <span className="font-mono">{c.id}</span>
                      <span>{c.fps} fps</span>
                    </div>
                    {/* IA detection box mockup */}
                    <div className="absolute border-2 border-success/80 rounded w-20 h-28 top-[28%] left-[40%]">
                      <span className="absolute -top-5 left-0 text-[10px] bg-success text-success-foreground px-1.5 rounded">capacete 0.97</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <WifiOff className="w-10 h-10 text-destructive mx-auto" />
                    <p className="text-xs text-destructive mt-2">Câmera offline</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{c.nome}</p>
                  {on
                    ? <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15"><Wifi className="w-3 h-3 mr-1" />Online</Badge>
                    : <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">Offline</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{c.setor} · {c.tipo}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
