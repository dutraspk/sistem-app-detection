import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, HardHat, DoorOpen, AlertTriangle, Cctv,
  Bell, Users, ShieldCheck, Menu, X, Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/epis", label: "EPIs", icon: HardHat },
  { to: "/acessos", label: "Acessos", icon: DoorOpen },
  { to: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
  { to: "/cameras", label: "Câmeras IA", icon: Cctv },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/usuarios", label: "Usuários", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/30">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight text-sidebar-foreground">EPI Guard</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Industrial AI</p>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success live-dot" />
            YOLOv4 ativo · 6 câmeras
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-success live-dot" />
              <span className="text-muted-foreground hidden sm:inline">Monitoramento em tempo real</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs px-2 py-1 rounded-md bg-success/15 text-success border border-success/30">
              IA Online
            </span>
            <div className="w-9 h-9 rounded-full bg-primary/20 ring-1 ring-primary/40 flex items-center justify-center text-sm font-medium">
              RM
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
