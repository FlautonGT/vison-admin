"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  FileClock,
  Gauge,
  LayoutDashboard,
  MenuSquare,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VisonAdminLogo } from "@/components/admin/logo";

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/organizations", label: "Organizations", icon: MenuSquare },
  { href: "/announcements", label: "Announcements", icon: BellRing },
  { href: "/rate-limits", label: "Rate Limits", icon: Gauge },
  { href: "/compliance", label: "Compliance", icon: FileClock },
  { href: "/fraud", label: "Fraud", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" /> : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col border-r border-white/6 bg-[var(--bg-sidebar)] text-white transition-transform duration-300 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="grid-pattern absolute inset-0 opacity-20" />
        <div className="relative flex items-center justify-between border-b border-white/6 px-6 py-5">
          <VisonAdminLogo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-white/65 hover:bg-[var(--bg-sidebar-soft)] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                    active ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "bg-white/5 text-white/60"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="flex-1">
                  <p>{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/40">
                    {item.label === "Overview" ? "Live mission board" : "Operational workspace"}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/6 p-4">
          <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Ops Note</p>
            <p className="mt-3 text-sm text-white/75">
              Semua tindakan sensitif ditulis ke audit log. Gunakan reason yang jelas agar review operasional rapi.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
