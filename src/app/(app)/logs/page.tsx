"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { formatCurrency, formatDateTime, getServiceLabel } from "@/lib/utils";
import type { AuditLogRow, GlobalLogRow } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function LogsPage() {
  const [globalLogs, setGlobalLogs] = useState<GlobalLogRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [service, setService] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [logsResponse, auditResponse] = await Promise.all([
      adminApi.getGlobalLogs({ page: 1, perPage: 40, service, status }),
      adminApi.getAuditLogs({ page: 1, perPage: 40 }),
    ]);
    setGlobalLogs(logsResponse.data ?? []);
    setAuditLogs(auditResponse.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, status]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard
        title="Global API Logs"
        eyebrow="Request Explorer"
        description="Gunakan log ini untuk melihat beban traffic, service yang dipakai, dan error stream lintas organization."
        actions={
          <>
            <input className="input-shell min-w-[160px]" placeholder="service" value={service} onChange={(event) => setService(event.target.value)} />
            <select className="select-shell min-w-[160px]" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Semua status</option>
              <option value="success">success</option>
              <option value="error">error</option>
            </select>
          </>
        }
      >
        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading request logs...</div>
        ) : globalLogs.length === 0 ? (
          <EmptyState title="Tidak ada log request" description="Belum ada log yang cocok dengan filter saat ini." />
        ) : (
          <div className="space-y-3">
            {globalLogs.map((log) => (
              <div key={log.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{log.orgName}</p>
                    <p className="text-sm text-[var(--text-dim)]">
                      {getServiceLabel(log.serviceType)} • {log.method} {log.endpoint}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-dim)]">{log.apiKeyName || "No API key label"} • {log.environment}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge label={log.statusCode >= 400 ? "error" : "success"} />
                    <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(log.cost)}</p>
                    <p className="text-xs text-[var(--text-dim)]">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Admin Audit Trail"
        eyebrow="Sensitive Actions"
        description="Semua perubahan sensitif dari admin console terekam di sini agar review incident dan approval flow lebih rapi."
      >
        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading admin audit trail...</div>
        ) : auditLogs.length === 0 ? (
          <EmptyState title="Belum ada admin audit log" description="Audit trail akan muncul setelah ada aksi admin yang tercatat." />
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{log.action}</p>
                    <p className="text-sm text-[var(--text-dim)]">{log.actor_email || "Unknown admin"}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{log.reason || "Tanpa reason"}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge label={log.target_type || "audit"} />
                    <p className="mt-2 text-xs text-[var(--text-dim)]">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
