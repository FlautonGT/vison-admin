"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Radar, ShieldAlert } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime, safeJsonStringify } from "@/lib/utils";
import type { FraudAlert, FraudSuggestion } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [suggestions, setSuggestions] = useState<FraudSuggestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const response = await adminApi.getFraudPanel();
    setAlerts(response.data?.alerts ?? []);
    setSuggestions(response.data?.suggestions ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!alerts.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !alerts.some((alert) => alert.id === selectedId)) {
      setSelectedId(alerts[0].id);
    }
  }, [alerts, selectedId]);

  const selectedAlert = alerts.find((alert) => alert.id === selectedId) || null;

  async function handleStatus(status: FraudAlert["status"]) {
    if (!selectedAlert) return;
    if (reason.trim().length < 3) {
      setNotice("Reason minimal 3 karakter.");
      return;
    }

    setSubmitting(true);
    setNotice(null);
    const response = await adminApi.updateFraudStatus(selectedAlert.id, status, reason);
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setReason("");
    setNotice(`Alert diubah ke status ${status}.`);
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-6">
        <SectionCard
          title="Alert Stream"
          eyebrow="Anomaly Detections"
          description="Alert yang dihasilkan dari traffic spike, error spike, suspicious key sharing, atau balance anomaly."
        >
          {alerts.length === 0 ? (
            <EmptyState title="Belum ada alert" description="Sistem fraud akan menaruh sinyal mencurigakan di sini." />
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  className={`w-full rounded-[24px] border p-5 text-left transition ${
                    selectedId === alert.id
                      ? "border-emerald-400/25 bg-emerald-400/[0.08]"
                      : "border-[var(--border-soft)] bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                  onClick={() => setSelectedId(alert.id)}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={alert.severity} mode="severity" />
                    <StatusBadge label={alert.status} />
                    <p className="text-sm text-[var(--text-dim)]">{alert.org_name}</p>
                  </div>
                  <p className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">{alert.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{alert.description || "No description."}</p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Auto Suggestions"
          eyebrow="Machine Heuristics"
          description="Saran quick triage berdasarkan pola usage yang terdeteksi di backend."
        >
          {suggestions.length === 0 ? (
            <EmptyState title="Belum ada suggestion" description="Suggestion akan muncul saat backend fraud service mulai mendeteksi pola anomali." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <div key={`${suggestion.kind}-${index}`} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                      <Radar className="h-5 w-5" />
                    </div>
                    <StatusBadge label={suggestion.severity} mode="severity" />
                  </div>
                  <p className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">{suggestion.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{suggestion.description}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Investigation Panel"
        eyebrow="Triage Controls"
        description="Lihat signal alert terpilih dan update status investigasinya."
      >
        {!selectedAlert ? (
          <EmptyState title="Pilih alert" description="Klik salah satu alert dari stream untuk membuka detail investigasi." />
        ) : (
          <div className="space-y-5">
            <div className="surface-soft p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">{selectedAlert.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedAlert.org_name}</p>
                </div>
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <StatusBadge label={selectedAlert.severity} mode="severity" />
                <StatusBadge label={selectedAlert.status} />
                <StatusBadge label={selectedAlert.alert_type} />
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{selectedAlert.description || "No description provided."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                  First seen: {formatDateTime(selectedAlert.first_seen_at)}
                  <br />
                  Last seen: {formatDateTime(selectedAlert.last_seen_at)}
                </div>
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                  API key: {selectedAlert.api_key_name || "n/a"}
                  <br />
                  Resolved by: {selectedAlert.resolved_by_email || "-"}
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Update Status</p>
                  <p className="text-sm text-[var(--text-muted)]">Semua perubahan status akan masuk audit log backend.</p>
                </div>
              </div>
              <textarea
                className="textarea-shell mt-4 min-h-[130px]"
                placeholder="Reason untuk update status..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              {notice ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">{notice}</div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {(["open", "investigating", "resolved", "ignored"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={status === "resolved" ? "button-primary" : status === "ignored" ? "button-danger" : "button-secondary"}
                    disabled={submitting}
                    onClick={() => handleStatus(status)}
                  >
                    Set {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-soft p-5">
              <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Signal Data</p>
              <pre className="mt-4 overflow-x-auto rounded-[20px] border border-[var(--border-soft)] bg-[#03100a] p-4 text-xs leading-6 text-emerald-200">
                {safeJsonStringify(selectedAlert.signal_data || {})}
              </pre>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
