"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { VisonAdminLogo } from "@/components/admin/logo";

export function LoginScreen({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { login, isAuthenticated } = useAdminAuth();
  const [email, setEmail] = useState("admin@vison.id");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, nextPath, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Login gagal.");
      return;
    }

    router.replace(nextPath);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,rgba(16,196,105,0.2),transparent_50%)]" />
        <div className="grid-pattern absolute inset-0 opacity-10" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-panel p-8 sm:p-10">
          <VisonAdminLogo />
          <div className="mt-8 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Platform Operations</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
              Command center untuk mengelola user, org, compliance, rate limit, dan incident.
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
              Dibangun untuk tim ops dan support yang butuh panel cepat, tegas, dan aman untuk seluruh ekosistem Vison.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["All-in-one control", "Ban user, deactivate org, compliance request, dan fraud triage dalam satu workspace."],
              ["Operational clarity", "Live snapshot untuk approval, alert, dan request spike tanpa harus pindah tool."],
              ["Review-friendly actions", "Setiap tindakan sensitif diarahkan ke flow yang audit-ready dan reason-based."],
            ].map(([title, description]) => (
              <div key={title} className="surface-soft p-4">
                <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">Admin Sign In</p>
              <p className="text-sm text-[var(--text-muted)]">Masuk dengan akun admin yang sudah di-assign ke RBAC backend.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">Email</label>
              <input className="input-shell" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">Password</label>
              <input
                type="password"
                className="input-shell"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
            <button type="submit" className="button-primary w-full" disabled={submitting}>
              <LockKeyhole className="h-4 w-4" />
              {submitting ? "Signing in..." : "Masuk ke Vison Admin"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Initial Access</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Seed awal saat ini: <span className="font-semibold text-[var(--text-primary)]">admin@vison.id</span>.
              Setelah review, kredensial ini sebaiknya langsung diganti.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
