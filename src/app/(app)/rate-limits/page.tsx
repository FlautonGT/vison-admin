"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { AdminOrganization, RateLimitMonitorItem, RateLimitOverrideRow } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function RateLimitsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [overrides, setOverrides] = useState<RateLimitOverrideRow[]>([]);
  const [monitor, setMonitor] = useState<RateLimitMonitorItem[]>([]);
  const [orgId, setOrgId] = useState("");
  const [requestsPerMinute, setRequestsPerMinute] = useState("");
  const [burstLimit, setBurstLimit] = useState("");
  const [temporaryRequestsPerMinute, setTemporaryRequestsPerMinute] = useState("");
  const [temporaryBurstLimit, setTemporaryBurstLimit] = useState("");
  const [temporaryUntil, setTemporaryUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [orgResponse, overrideResponse, monitorResponse] = await Promise.all([
      adminApi.getOrganizations({ page: 1, perPage: 100 }),
      adminApi.getRateLimitOverrides(),
      adminApi.getRateLimitMonitor(),
    ]);
    setOrganizations(orgResponse.data ?? []);
    setOverrides(overrideResponse.data?.overrides ?? []);
    setMonitor(monitorResponse.data?.monitor ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function applyOrg(orgIdValue: string) {
    setOrgId(orgIdValue);
    const existing = overrides.find((item) => item.org_id === orgIdValue);
    if (!existing) return;
    setRequestsPerMinute(existing.requests_per_minute ? String(existing.requests_per_minute) : "");
    setBurstLimit(existing.burst_limit ? String(existing.burst_limit) : "");
    setTemporaryRequestsPerMinute(existing.temporary_requests_per_minute ? String(existing.temporary_requests_per_minute) : "");
    setTemporaryBurstLimit(existing.temporary_burst_limit ? String(existing.temporary_burst_limit) : "");
    setTemporaryUntil(existing.temporary_until ? new Date(existing.temporary_until).toISOString().slice(0, 16) : "");
    setNotes(existing.notes || "");
  }

  async function handleSubmit() {
    if (!orgId) {
      setNotice("Pilih organization terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setNotice(null);
    const payload: Record<string, unknown> = {
      notes,
    };
    if (requestsPerMinute) payload.requestsPerMinute = Number(requestsPerMinute);
    if (burstLimit) payload.burstLimit = Number(burstLimit);
    if (temporaryRequestsPerMinute) payload.temporaryRequestsPerMinute = Number(temporaryRequestsPerMinute);
    if (temporaryBurstLimit) payload.temporaryBurstLimit = Number(temporaryBurstLimit);
    if (temporaryUntil) payload.temporaryUntil = new Date(temporaryUntil).toISOString();

    const response = await adminApi.upsertRateLimitOverride(orgId, payload);
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setNotice("Rate limit override berhasil disimpan.");
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        title="Override Composer"
        eyebrow="Quota Control"
        description="Atur override RPM, burst, dan temporary boost untuk organization tertentu."
      >
        <div className="space-y-4">
          <select className="select-shell" value={orgId} onChange={(event) => applyOrg(event.target.value)}>
            <option value="">Pilih organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input-shell"
              placeholder="Requests per minute"
              value={requestsPerMinute}
              onChange={(event) => setRequestsPerMinute(event.target.value)}
            />
            <input
              className="input-shell"
              placeholder="Burst limit"
              value={burstLimit}
              onChange={(event) => setBurstLimit(event.target.value)}
            />
            <input
              className="input-shell"
              placeholder="Temporary RPM"
              value={temporaryRequestsPerMinute}
              onChange={(event) => setTemporaryRequestsPerMinute(event.target.value)}
            />
            <input
              className="input-shell"
              placeholder="Temporary burst"
              value={temporaryBurstLimit}
              onChange={(event) => setTemporaryBurstLimit(event.target.value)}
            />
          </div>
          <input
            type="datetime-local"
            className="input-shell"
            value={temporaryUntil}
            onChange={(event) => setTemporaryUntil(event.target.value)}
          />
          <textarea
            className="textarea-shell min-h-[140px]"
            placeholder="Catatan kenapa override ini diperlukan..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          {notice ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">{notice}</div>
          ) : null}
          <button type="button" className="button-primary w-full" disabled={submitting} onClick={handleSubmit}>
            <Sparkles className="h-4 w-4" />
            {submitting ? "Saving..." : "Save override"}
          </button>
        </div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard
          title="Realtime Watch"
          eyebrow="Traffic Hotspots"
          description="Org yang sedang mendekati limit atau menghasilkan error tinggi dalam 15 menit terakhir."
        >
          {monitor.length === 0 ? (
            <EmptyState title="Belum ada hotspot traffic" description="Saat request live meningkat, monitor akan terisi otomatis." />
          ) : (
            <div className="space-y-3">
              {monitor.slice(0, 8).map((item) => (
                <button
                  key={item.orgId}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4 text-left"
                  onClick={() => applyOrg(item.orgId)}
                >
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{item.orgName}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      1m: {formatNumber(item.requestsLast1m)} | 15m: {formatNumber(item.requestsLast15m)} | Errors:{" "}
                      {formatNumber(item.errorCountLast15m)}
                    </p>
                  </div>
                  <StatusBadge label={item.errorCountLast15m > 0 ? "warning" : "active"} />
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Current Overrides"
          eyebrow="Saved Rules"
          description="Daftar override yang aktif atau pernah dikonfigurasi oleh admin."
        >
          {overrides.length === 0 ? (
            <EmptyState title="Belum ada override" description="Gunakan composer di kiri untuk membuat override pertama." />
          ) : (
            <div className="table-shell overflow-hidden rounded-[24px] border border-[var(--border-soft)]">
              <table className="min-w-full">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left">Organization</th>
                    <th className="px-4 py-3 text-left">Base RPM</th>
                    <th className="px-4 py-3 text-left">Temp RPM</th>
                    <th className="px-4 py-3 text-left">Until</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((item) => (
                    <tr key={item.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => applyOrg(item.org_id)}>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.org_name}</td>
                      <td className="px-4 py-3">{item.requests_per_minute || "-"}</td>
                      <td className="px-4 py-3">{item.temporary_requests_per_minute || "-"}</td>
                      <td className="px-4 py-3">{formatDateTime(item.temporary_until)}</td>
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
