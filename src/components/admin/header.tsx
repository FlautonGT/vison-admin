"use client";

import { Menu, MoonStar, Search, SunMedium } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useTheme } from "@/hooks/use-theme";
import { getInitials } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "/overview": "Overview",
  "/users": "Users",
  "/organizations": "Organizations",
  "/announcements": "Announcements",
  "/rate-limits": "Rate Limits",
  "/compliance": "Compliance",
  "/fraud": "Fraud Detection",
  "/settings": "Settings",
};

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { admin, profile, logout } = useAdminAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const currentLabel = routeLabels[pathname] ?? "Vison Admin";

  return (
    <header className="surface-soft sticky top-4 z-20 mb-6 flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenuClick} className="button-secondary lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Current Workspace</p>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">{currentLabel}</h1>
        </div>
      </div>

      <div className="hidden min-w-[280px] max-w-[420px] flex-1 items-center gap-3 rounded-[20px] border border-[var(--border-soft)] bg-white/5 px-4 py-3 md:flex">
        <Search className="h-4 w-4 text-[var(--text-dim)]" />
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Search organizations, emails, or incident IDs</p>
          <p className="text-xs text-[var(--text-dim)]">Universal search UI prepared for next iteration</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300 xl:inline-flex">
          Live Control Plane
        </div>
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="button-secondary px-3"
        >
          {resolvedTheme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>
        <button type="button" onClick={logout} className="hidden button-secondary xl:inline-flex">
          Sign out
        </button>
        <div className="flex items-center gap-3 rounded-[20px] border border-[var(--border-soft)] bg-white/5 px-3 py-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-display text-sm font-bold text-[var(--accent-strong)]">
            {getInitials(profile?.fullName || admin?.email)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{profile?.fullName || "Platform Admin"}</p>
            <p className="text-xs text-[var(--text-dim)]">{admin?.roles?.join(", ") || admin?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
