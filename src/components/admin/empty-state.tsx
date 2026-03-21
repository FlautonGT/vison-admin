import { Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">{description}</p>
    </div>
  );
}
