import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  accent = "emerald",
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: "emerald" | "cyan" | "amber" | "rose" | "violet";
  icon: React.ReactNode;
}) {
  return (
    <div className={cn("metric-card", `metric-card-${accent}`)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{hint}</p>
        </div>
        <div className="metric-icon">{icon}</div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>Live operational snapshot</span>
      </div>
    </div>
  );
}
