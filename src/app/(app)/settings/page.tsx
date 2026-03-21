"use client";

import { useEffect, useState } from "react";
import { LayoutPanelTop, ShieldCheck, Shapes } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { formatDateTime } from "@/lib/utils";
import type { ActionApprovalRow, AdminRoleRow, AssignmentRow, AuditLogRow, DashboardTile, SavedView } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function SettingsPage() {
  const { admin, profile } = useAdminAuth();
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [dashboardTiles, setDashboardTiles] = useState<DashboardTile[]>([]);
  const [approvals, setApprovals] = useState<ActionApprovalRow[]>([]);

  useEffect(() => {
    async function load() {
      const [roleResponse, assignmentResponse, auditResponse, savedResponse, tilesResponse, approvalsResponse] =
        await Promise.all([
          adminApi.getRoles(),
          adminApi.getAssignments(),
          adminApi.getAuditLogs({ page: 1, perPage: 20 }),
          adminApi.getSavedViews(),
          adminApi.getDashboardTiles(),
          adminApi.getActionApprovals(),
        ]);

      setRoles(roleResponse.data?.roles ?? []);
      setAssignments(assignmentResponse.data?.assignments ?? []);
      setAuditLogs(auditResponse.data ?? []);
      setSavedViews(savedResponse.data?.views ?? []);
      setDashboardTiles(tilesResponse.data?.tiles ?? []);
      setApprovals(approvalsResponse.data?.approvals ?? []);
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Admin Workspace Settings"
        eyebrow="Identity & Permissions"
        description="Ringkasan identitas admin aktif, role yang tersedia, assignment, serta blok audit paling penting."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="surface-soft p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Signed In</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">{profile?.fullName || admin?.email}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{admin?.email}</p>
          </div>
          <div className="surface-soft p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Roles</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">{admin?.roles?.length || 0}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{admin?.roles?.join(", ") || "No roles"}</p>
          </div>
          <div className="surface-soft p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Saved Views</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">{savedViews.length}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Personal shortcuts for repeated workflows.</p>
          </div>
          <div className="surface-soft p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Pending Approvals</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {approvals.filter((item) => item.status === "pending").length}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Dual-control actions waiting for follow-up.</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Role Catalog" eyebrow="RBAC" description="Role system yang tersedia di backend admin.">
          {roles.length === 0 ? (
            <EmptyState title="Role belum tersedia" description="Role akan muncul setelah data RBAC dibaca dari backend." />
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{role.name}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{role.description || role.code}</p>
                    </div>
                    <StatusBadge label={role.is_active ? "active" : "inactive"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Assignments" eyebrow="Who Can Do What" description="Mapping admin ke role global atau org-scoped.">
          {assignments.length === 0 ? (
            <EmptyState title="Belum ada assignment" description="Assignment admin akan tampil di sini setelah dibuat." />
          ) : (
            <div className="table-shell overflow-hidden rounded-[24px] border border-[var(--border-soft)]">
              <table className="min-w-full">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left">Admin</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{assignment.user_full_name}</p>
                        <p className="text-sm text-[var(--text-dim)]">{assignment.user_email}</p>
                      </td>
                      <td className="px-4 py-3">{assignment.role_name}</td>
                      <td className="px-4 py-3">{assignment.scope_type === "org" ? assignment.org_name || "Scoped org" : "Global"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={assignment.is_active ? "active" : "inactive"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Saved Views & Tiles" eyebrow="Personalization" description="Workspace personal tiap admin untuk view dan dashboard tile.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <Shapes className="h-5 w-5 text-[var(--accent-strong)]" />
                <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Saved Views</p>
              </div>
              <div className="mt-4 space-y-3">
                {savedViews.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Belum ada saved view.</p>
                ) : (
                  savedViews.map((view) => (
                    <div key={view.id} className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-3">
                      <p className="font-medium text-[var(--text-primary)]">{view.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">{view.resource}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <LayoutPanelTop className="h-5 w-5 text-[var(--accent-strong)]" />
                <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Dashboard Tiles</p>
              </div>
              <div className="mt-4 space-y-3">
                {dashboardTiles.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Belum ada tile custom.</p>
                ) : (
                  dashboardTiles.map((tile) => (
                    <div key={tile.id} className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-3">
                      <p className="font-medium text-[var(--text-primary)]">{tile.tileKey}</p>
                      <p className="text-sm text-[var(--text-muted)]">Position {tile.position}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Approval Requests" eyebrow="Dual Control" description="Request destruktif yang sedang menunggu approval admin lain.">
          {approvals.length === 0 ? (
            <EmptyState title="Tidak ada approval request" description="Approval request akan muncul saat destructive flow sudah aktif dipakai." />
          ) : (
            <div className="space-y-3">
              {approvals.slice(0, 6).map((approval) => (
                <div key={approval.id} className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={approval.status} />
                    <p className="text-sm text-[var(--text-dim)]">{approval.action_type}</p>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">{approval.target_type}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{approval.reason}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Admin Audit Log" eyebrow="Traceability" description="Snapshot audit terbaru untuk memastikan setiap aksi admin bisa ditelusuri.">
        {auditLogs.length === 0 ? (
          <EmptyState title="Audit log kosong" description="Saat admin action mulai berjalan, log akan muncul di sini." />
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                <div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-[var(--accent-strong)]" />
                    <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{log.action}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{log.reason || "No reason captured."}</p>
                </div>
                <div className="text-right text-xs text-[var(--text-dim)]">
                  <p>{formatDateTime(log.created_at)}</p>
                  <p>{log.target_type || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
