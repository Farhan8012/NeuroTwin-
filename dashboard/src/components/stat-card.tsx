import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon: LucideIcon;
  tone?: "primary" | "secondary" | "accent" | "muted";
};

const toneMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  accent: "bg-accent/15 text-accent",
  muted: "bg-muted text-muted-foreground",
} as const;

export function StatCard({ label, value, hint, trend, icon: Icon, tone = "primary" }: Props) {
  return (
    <Card className="rounded-2xl border-border shadow-none">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.direction === "up" && "bg-success/10 text-success",
                trend.direction === "down" && "bg-destructive/10 text-destructive",
                trend.direction === "flat" && "bg-muted text-muted-foreground",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              {trend.value}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
