import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("surface-panel overflow-hidden", className)}>
      <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
