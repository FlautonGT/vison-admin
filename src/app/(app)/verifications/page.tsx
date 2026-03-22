"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/utils";
import type { VerificationQueueRow } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

const reviewStatuses = ["", "not_started", "submitted", "needs_review", "approved", "rejected"] as const;

export default function VerificationsPage() {
  const [kycItems, setKycItems] = useState<VerificationQueueRow[]>([]);
  const [kybItems, setKybItems] = useState<VerificationQueueRow[]>([]);
  const [kycStatus, setKycStatus] = useState("");
  const [kybStatus, setKybStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [kycResponse, kybResponse] = await Promise.all([adminApi.getKYCReviews(kycStatus), adminApi.getKYBReviews(kybStatus)]);
    setKycItems(kycResponse.data?.items ?? []);
    setKybItems(kybResponse.data?.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycStatus, kybStatus]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard
        title="KYC Review Queue"
        eyebrow="User Verification"
        description="Antrian ini membantu support dan compliance melihat status KYC paling baru tanpa membuka user satu per satu."
        actions={
          <select className="select-shell min-w-[180px]" value={kycStatus} onChange={(event) => setKycStatus(event.target.value)}>
            <option value="">Semua status</option>
            {reviewStatuses.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        }
      >
        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading KYC queue...</div>
        ) : kycItems.length === 0 ? (
          <EmptyState title="KYC queue kosong" description="Belum ada user yang cocok dengan filter review saat ini." />
        ) : (
          <div className="space-y-3">
            {kycItems.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-cyan-400/10 p-2 text-cyan-300">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-sm text-[var(--text-dim)]">{item.email || "Email tidak tersedia"}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.reviewNotes || "Belum ada catatan review."}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge label={item.status} />
                    <span className="text-xs text-[var(--text-dim)]">{formatDateTime(item.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="KYB Review Queue"
        eyebrow="Organization Verification"
        description="Lihat tenant yang sedang review legal entity, termasuk outcome terakhir dan reviewer yang menyentuh kasusnya."
        actions={
          <select className="select-shell min-w-[180px]" value={kybStatus} onChange={(event) => setKybStatus(event.target.value)}>
            <option value="">Semua status</option>
            {reviewStatuses.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        }
      >
        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading KYB queue...</div>
        ) : kybItems.length === 0 ? (
          <EmptyState title="KYB queue kosong" description="Belum ada organization yang cocok dengan filter review saat ini." />
        ) : (
          <div className="space-y-3">
            {kybItems.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-[var(--accent-soft)] p-2 text-[var(--accent-strong)]">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-sm text-[var(--text-dim)]">{item.email || "Owner email tidak tersedia"}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.reviewNotes || "Belum ada catatan review."}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge label={item.status} />
                    <span className="text-xs text-[var(--text-dim)]">{formatDateTime(item.updatedAt)}</span>
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
