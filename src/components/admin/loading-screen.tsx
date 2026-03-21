export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent-strong)]" />
        <div>
          <p className="font-medium text-[var(--text-primary)]">Preparing Vison Admin</p>
          <p className="text-sm text-[var(--text-muted)]">Loading workspace, roles, and operational context.</p>
        </div>
      </div>
    </div>
  );
}
