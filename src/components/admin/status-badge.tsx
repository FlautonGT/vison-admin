import { cn, severityTone, statusTone } from "@/lib/utils";

const toneMap = {
  neutral: "border-white/10 bg-white/5 text-[var(--text-secondary)]",
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

export function StatusBadge({
  label,
  mode = "status",
}: {
  label?: string | null;
  mode?: "status" | "severity";
}) {
  const tone = mode === "severity" ? severityTone(label) : statusTone(label);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        toneMap[tone]
      )}
    >
      {label || "unknown"}
    </span>
  );
}
