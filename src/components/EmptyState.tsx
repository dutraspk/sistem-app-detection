import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="bg-card border-border border-dashed p-12 text-center">
      <div className="w-14 h-14 rounded-xl bg-primary/10 ring-1 ring-primary/20 mx-auto flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <p className="mt-4 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}
