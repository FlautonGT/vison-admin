"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BellRing,
  ChevronRight,
  Gauge,
  ShieldAlert,
  Users,
  Waypoints,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { adminApi } from "@/lib/admin-api";
import { formatNumber, formatRelativeTime, getServiceLabel } from "@/lib/utils";
import type {
  ActionApprovalRow,
  Announcement,
  ComplianceRequest,
  FraudAlert,
  Overview,
  RateLimitMonitorItem,
  TopService,
} from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function OverviewPage() {
  const { profile } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [approvals, setApprovals] = useState<ActionApprovalRow[]>([]);
  const [compliance, setCompliance] = useState<ComplianceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [monitor, setMonitor] = useState<RateLimitMonitorItem[]>([]);

  useEffect(() => {
    async function load() {
      const [
        overviewResponse,
        fraudResponse,
        approvalResponse,
        complianceResponse,
        announcementResponse,
        monitorResponse,
      ] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getFraudPanel(),
        adminApi.getActionApprovals(),
        adminApi.getComplianceRequests(),
        adminApi.getAnnouncements(),
        adminApi.getRateLimitMonitor(),
      ]);

      setOverview(overviewResponse.data?.overview ?? null);
      setTopServices(overviewResponse.data?.topServices ?? []);
      setAlerts(fraudResponse.data?.alerts ?? []);
      setApprovals(approvalResponse.data?.approvals ?? []);
      setCompliance(complianceResponse.data?.requests ?? []);
      setAnnouncements(announcementResponse.data?.announcements ?? []);
      setMonitor(monitorResponse.data?.monitor ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <section className="surface-panel overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Mission Brief</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-[var(--text-primary)]">
              {getGreeting()}, {profile?.fullName?.split(" ")[0] || "Admin"}.
              <span className="block text-[var(--text-secondary)]">Semua sinyal penting platform ada di sini.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
              Pantau health operasional, volume request, approval sensitif, fraud signal, dan komunikasi massal dari satu
              command center.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 font-semibold text-emerald-300">
                Control plane active
              </span>
              <span>{today}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Users", href: "/users", description: "Moderation, ban, dan incident support", icon: Users },
              { title: "Organizations", href: "/organizations", description: "Deactivate, delete flow, dan owner tracing", icon: Waypoints },
              { title: "Announcements", href: "/announcements", description: "Broadcast banner dan urgent notice", icon: BellRing },
              { title: "Fraud Panel", href: "/fraud", description: "Anomaly triage dan suspicious key activity", icon: ShieldAlert },
            ].map((item) => {
              const NavIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="surface-soft group flex items-center justify-between gap-4 p-4 transition hover:-translate-y-0.5"
                >
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                    <NavIcon className="h-5 w-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Users"
          value={loading ? "..." : formatNumber(overview?.totalUsers || 0)}
          hint={`${formatNumber(overview?.activeUsers || 0)} active, ${formatNumber(overview?.suspendedUsers || 0)} suspended`}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Organizations"
          value={loading ? "..." : formatNumber(overview?.totalOrganizations || 0)}
          hint={`${formatNumber(overview?.activeOrganizations || 0)} active, ${formatNumber(overview?.deactivatedOrganizations || 0)} paused`}
          accent="cyan"
          icon={<Waypoints className="h-5 w-5" />}
        />
        <MetricCard
          label="Requests 24h"
          value={loading ? "..." : formatNumber(overview?.requestsLast24Hours || 0)}
          hint={`${formatNumber(overview?.errorsLast24Hours || 0)} error events in last day`}
          accent="amber"
          icon={<Gauge className="h-5 w-5" />}
        />
        <MetricCard
          label="Risk Queue"
          value={loading ? "..." : formatNumber((overview?.openFraudAlerts || 0) + (overview?.pendingApprovals || 0))}
          hint={`${formatNumber(overview?.openFraudAlerts || 0)} fraud, ${formatNumber(overview?.pendingApprovals || 0)} approvals`}
          accent="rose"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Service Traffic"
          eyebrow="Last 7 Days"
          description="Service dengan volume tertinggi agar tim ops cepat melihat pergeseran traffic."
        >
          {topServices.length === 0 ? (
            <EmptyState title="Belum ada traffic terbaru" description="Chart akan muncul saat API request mulai masuk." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices.map((item) => ({ ...item, label: getServiceLabel(item.serviceType) }))}>
                  <CartesianGrid vertical={false} stroke="rgba(127,143,137,0.18)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--text-dim)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(7,17,15,0.92)",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <Bar dataKey="totalCalls" radius={[10, 10, 0, 0]} fill="url(#barGradient)" />
                  <defs>
                    <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#31e18a" />
                      <stop offset="100%" stopColor="#0c8350" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Priority Queues"
          eyebrow="Needs Attention"
          description="Queue paling dekat dengan decision point."
        >
          <div className="space-y-4">
            {[
              ["Approvals pending", approvals.slice(0, 3).map((item) => item.action_type).join(", ") || "No pending approvals", "/settings"],
              ["Compliance queue", compliance.slice(0, 3).map((item) => item.request_type).join(", ") || "No active requests", "/compliance"],
              ["Announcements live", announcements.filter((item) => item.isActive).slice(0, 2).map((item) => item.title).join(", ") || "No live notice", "/announcements"],
            ].map(([label, description, href]) => (
              <Link
                key={label}
                href={href as string}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{label}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--text-dim)]" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Fraud & Incident Radar"
          eyebrow="Open Alerts"
          description="Anomaly yang paling baru muncul atau belum ditutup."
          actions={<Link className="button-secondary" href="/fraud">Open Panel</Link>}
        >
          {alerts.length === 0 ? (
            <EmptyState title="Belum ada fraud alert terbuka" description="Sistem akan menampilkan signal mencurigakan di sini." />
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={alert.severity} mode="severity" />
                    <StatusBadge label={alert.status} />
                    <p className="text-sm text-[var(--text-dim)]">{alert.org_name}</p>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">{alert.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{alert.description || "No description provided."}</p>
                  <p className="mt-3 text-xs text-[var(--text-dim)]">Last seen {formatRelativeTime(alert.last_seen_at)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Rate Limit Watch"
          eyebrow="Hot Organizations"
          description="Org yang sedang mendorong traffic paling tinggi dalam 15 menit terakhir."
          actions={<Link className="button-secondary" href="/rate-limits">Manage Overrides</Link>}
        >
          {monitor.length === 0 ? (
            <EmptyState title="Monitor masih tenang" description="Traffic live akan muncul setelah request masuk ke sistem." />
          ) : (
            <div className="table-shell overflow-hidden rounded-[22px] border border-[var(--border-soft)]">
              <table className="min-w-full">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left">Organization</th>
                    <th className="px-4 py-3 text-left">1 Min</th>
                    <th className="px-4 py-3 text-left">15 Min</th>
                    <th className="px-4 py-3 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {monitor.slice(0, 6).map((row) => (
                    <tr key={row.orgId}>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.orgName}</td>
                      <td className="px-4 py-3">{formatNumber(row.requestsLast1m)}</td>
                      <td className="px-4 py-3">{formatNumber(row.requestsLast15m)}</td>
                      <td className="px-4 py-3">{formatNumber(row.errorCountLast15m)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
