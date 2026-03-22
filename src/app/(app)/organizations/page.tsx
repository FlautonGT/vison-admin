"use client";

import { useEffect, useState } from "react";
import { Building2, Coins, PauseCircle, PlayCircle, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime, safeJsonStringify } from "@/lib/utils";
import type { AdminOrganization, AdminOrganizationDetail } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

const orgStatusOptions = ["active", "deactivated", "deleted"] as const;
const kybStatusOptions = ["not_started", "submitted", "needs_review", "approved", "rejected"] as const;

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [kybStatus, setKybStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrganizationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [pricingTierDraft, setPricingTierDraft] = useState("starter");
  const [discountDraft, setDiscountDraft] = useState("0");
  const [balanceType, setBalanceType] = useState<"credit" | "debit">("credit");
  const [balanceAmount, setBalanceAmount] = useState("50000");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [kybStatusDraft, setKybStatusDraft] = useState("not_started");
  const [kybReviewNotes, setKybReviewNotes] = useState("");
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadOrganizations() {
    setLoading(true);
    const response = await adminApi.getOrganizations({ query, status, kybStatus, page: 1, perPage: 50 });
    setOrganizations(response.data ?? []);
    setLoading(false);
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    const response = await adminApi.getOrganizationDetail(id);
    setDetail(response.data ?? null);
    setDetailLoading(false);
  }

  useEffect(() => {
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, kybStatus]);

  useEffect(() => {
    if (!organizations.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !organizations.some((org) => org.id === selectedId)) {
      setSelectedId(organizations[0].id);
    }
  }, [organizations, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!detail?.organization) return;
    setPricingTierDraft(detail.organization.pricingTier);
    setDiscountDraft(`${detail.organization.discountPercent}`);
    setKybStatusDraft(detail.organization.kybStatus);
    setKybReviewNotes(detail.organization.kybReviewNotes ?? "");
    setConfirmName("");
  }, [detail]);

  const selectedOrg = organizations.find((org) => org.id === selectedId) ?? null;

  async function runAction(actionKey: string, task: () => Promise<{ error?: { message: string } }>, successMessage: string) {
    if (reason.trim().length < 5) {
      setNotice("Reason minimal 5 karakter.");
      return;
    }

    setSubmittingKey(actionKey);
    const response = await task();
    setSubmittingKey(null);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setNotice(successMessage);
    await loadOrganizations();
    if (selectedId) {
      await loadDetail(selectedId);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard
        title="Organization Control Center"
        eyebrow="Tenant Operations"
        description="Satu workspace untuk status tenant, commercial override, KYB review, balance, dan destructive controls."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <input
            className="input-shell"
            placeholder="Cari nama organization, owner, atau business name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="select-shell" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Semua status tenant</option>
            {orgStatusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="select-shell" value={kybStatus} onChange={(event) => setKybStatus(event.target.value)}>
            <option value="">Semua status KYB</option>
            {kybStatusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading organizations...</div>
        ) : organizations.length === 0 ? (
          <EmptyState title="Tidak ada organization yang cocok" description="Coba ubah filter atau tunggu tenant baru masuk." />
        ) : (
          <div className="table-shell overflow-hidden rounded-[24px] border border-[var(--border-soft)]">
            <table className="min-w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left">Organization</th>
                  <th className="px-4 py-3 text-left">Tenant</th>
                  <th className="px-4 py-3 text-left">KYB</th>
                  <th className="px-4 py-3 text-left">Commercial</th>
                  <th className="px-4 py-3 text-left">7D Usage</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr
                    key={organization.id}
                    className={selectedId === organization.id ? "bg-emerald-400/[0.06]" : "cursor-pointer hover:bg-white/[0.03]"}
                    onClick={() => setSelectedId(organization.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--text-primary)]">{organization.name}</p>
                      <p className="text-sm text-[var(--text-dim)]">{organization.type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <StatusBadge label={organization.status} />
                        <span className="text-xs text-[var(--text-dim)]">{organization.ownerEmail || "Owner belum ada"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={organization.kybStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <p>Tier {organization.pricingTier}</p>
                      <p>Discount {organization.discountPercent}%</p>
                      <p>{formatCurrency(organization.balanceAmount)}</p>
                    </td>
                    <td className="px-4 py-3">{formatNumber(organization.requestsLast7Days)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Selected Organization"
        eyebrow="Ops Console"
        description="Panel kanan fokus ke commercial control, balance action, KYB, dan state tenant tanpa perlu pindah page."
      >
        {!selectedOrg ? (
          <EmptyState title="Pilih organization" description="Klik salah satu tenant di tabel untuk membuka detail operasional." />
        ) : detailLoading || !detail ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading organization detail...</div>
        ) : (
          <div className="space-y-5">
            <div className="surface-soft p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">{detail.organization.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{detail.organization.website || detail.organization.businessName || "Profil bisnis belum lengkap"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge label={detail.organization.status} />
                  <StatusBadge label={detail.organization.kybStatus} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Commercial</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Tier {detail.organization.pricingTier}.
                    <br />
                    Discount {detail.organization.discountPercent}%.
                    <br />
                    Balance {formatCurrency(detail.balance?.amount || 0)}.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Footprint</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {detail.members.length} members.
                    <br />
                    {(detail.apiKeys || []).length} API keys.
                    <br />
                    Created {formatRelativeTime(detail.organization.createdAt)}.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Ops Reason</p>
                  <p className="text-sm text-[var(--text-muted)]">Semua update di bawah akan dicatat dengan reason ini.</p>
                </div>
              </div>
              <textarea
                className="textarea-shell mt-4 min-h-[110px]"
                placeholder="Reason untuk perubahan commercial, balance, KYB, atau destructive action..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              {notice ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="surface-soft p-5">
                <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Commercial Override</p>
                <div className="mt-4 grid gap-3">
                  <input className="input-shell" value={pricingTierDraft} onChange={(event) => setPricingTierDraft(event.target.value)} />
                  <input
                    className="input-shell"
                    type="number"
                    min={0}
                    max={100}
                    value={discountDraft}
                    onChange={(event) => setDiscountDraft(event.target.value)}
                  />
                  <button
                    type="button"
                    className="button-primary"
                    disabled={submittingKey === "commercial"}
                    onClick={() =>
                      runAction(
                        "commercial",
                        () =>
                          adminApi.updateOrganizationCommercial(detail.organization.id, {
                            pricingTier: pricingTierDraft,
                            discountPercent: Number(discountDraft || 0),
                            reason,
                          }),
                        "Commercial setting organization berhasil diperbarui."
                      )
                    }
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {submittingKey === "commercial" ? "Saving..." : "Save commercial"}
                  </button>
                </div>
              </div>

              <div className="surface-soft p-5">
                <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Balance Adjustment</p>
                <div className="mt-4 grid gap-3">
                  <select className="select-shell" value={balanceType} onChange={(event) => setBalanceType(event.target.value as "credit" | "debit")}>
                    <option value="credit">credit</option>
                    <option value="debit">debit</option>
                  </select>
                  <input
                    className="input-shell"
                    type="number"
                    min={1}
                    value={balanceAmount}
                    onChange={(event) => setBalanceAmount(event.target.value)}
                    placeholder="Jumlah adjustment"
                  />
                  <input
                    className="input-shell"
                    value={balanceDescription}
                    onChange={(event) => setBalanceDescription(event.target.value)}
                    placeholder="Deskripsi adjustment"
                  />
                  <button
                    type="button"
                    className="button-primary"
                    disabled={submittingKey === "balance"}
                    onClick={() =>
                      runAction(
                        "balance",
                        () =>
                          adminApi.adjustBalance({
                            orgId: detail.organization.id,
                            type: balanceType,
                            amount: Number(balanceAmount || 0),
                            description: balanceDescription || `Manual ${balanceType} adjustment`,
                            reason,
                          }),
                        "Saldo organization berhasil di-adjust."
                      )
                    }
                  >
                    <Coins className="h-4 w-4" />
                    {submittingKey === "balance" ? "Processing..." : "Apply balance"}
                  </button>
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">KYB Review</p>
                  <p className="text-sm text-[var(--text-muted)]">Review business documents, NPWP/NIB, lalu simpulkan KYB dari panel yang sama.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <select className="select-shell" value={kybStatusDraft} onChange={(event) => setKybStatusDraft(event.target.value)}>
                  {kybStatusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea-shell min-h-[110px]"
                  placeholder="Catatan review KYB, mismatch data legal, atau instruksi resubmission..."
                  value={kybReviewNotes}
                  onChange={(event) => setKybReviewNotes(event.target.value)}
                />
                <button
                  type="button"
                  className="button-primary"
                  disabled={submittingKey === "kyb"}
                  onClick={() =>
                    runAction(
                      "kyb",
                      () =>
                        adminApi.reviewOrganizationKYB(detail.organization.id, {
                          status: kybStatusDraft,
                          reviewNotes: kybReviewNotes,
                          reason,
                        }),
                      "KYB organization berhasil diperbarui."
                    )
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                  {submittingKey === "kyb" ? "Saving..." : "Save KYB review"}
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--border-soft)] bg-black/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Documents</p>
                  <pre className="mt-3 overflow-x-auto text-xs text-[var(--text-secondary)]">
                    {safeJsonStringify(detail.organization.documents ?? { message: "Belum ada dokumen KYB." })}
                  </pre>
                </div>
                <div className="rounded-[22px] border border-[var(--border-soft)] bg-black/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Business Profile</p>
                  <pre className="mt-3 overflow-x-auto text-xs text-[var(--text-secondary)]">
                    {safeJsonStringify({
                      businessName: detail.organization.businessName,
                      businessCategory: detail.organization.businessCategory,
                      businessSubCategory: detail.organization.businessSubCategory,
                      npwp: detail.organization.npwp,
                      nib: detail.organization.nib,
                      address: detail.organization.address,
                    })}
                  </pre>
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-400/10 p-3 text-rose-300">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Destructive Controls</p>
                  <p className="text-sm text-[var(--text-muted)]">Pause, restore, atau soft delete tenant dengan konfirmasi nama entity.</p>
                </div>
              </div>
              <input
                className="input-shell mt-4"
                placeholder="Ketik nama organization untuk delete confirmation"
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                {detail.organization.status !== "deactivated" ? (
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={submittingKey === "deactivate"}
                    onClick={() =>
                      runAction(
                        "deactivate",
                        () => adminApi.deactivateOrganization(detail.organization.id, reason),
                        "Organization berhasil di-deactivate."
                      )
                    }
                  >
                    <PauseCircle className="h-4 w-4" />
                    {submittingKey === "deactivate" ? "Processing..." : "Deactivate"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button-primary"
                    disabled={submittingKey === "reactivate"}
                    onClick={() =>
                      runAction(
                        "reactivate",
                        () => adminApi.reactivateOrganization(detail.organization.id, reason),
                        "Organization berhasil di-reactivate."
                      )
                    }
                  >
                    <PlayCircle className="h-4 w-4" />
                    {submittingKey === "reactivate" ? "Processing..." : "Reactivate"}
                  </button>
                )}
                <button
                  type="button"
                  className="button-danger"
                  disabled={submittingKey === "delete"}
                  onClick={() =>
                    runAction(
                      "delete",
                      () => adminApi.deleteOrganization(detail.organization.id, reason, confirmName),
                      "Organization berhasil di-soft delete."
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  {submittingKey === "delete" ? "Deleting..." : "Soft delete"}
                </button>
              </div>
            </div>

            <div className="surface-soft p-5">
              <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Team Snapshot</p>
              <div className="mt-4 space-y-3">
                {detail.members.slice(0, 6).map((member) => (
                  <div key={member.id} className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{member.fullName || member.email || member.userId}</p>
                        <p className="text-sm text-[var(--text-dim)]">{member.email || "Email tidak tersedia"}</p>
                      </div>
                      <div className="flex gap-2">
                        <StatusBadge label={member.role} />
                        <StatusBadge label={member.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {detail.members.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-white/10 px-4 py-5 text-sm text-[var(--text-muted)]">
                    Tenant ini belum punya member aktif.
                  </div>
                ) : null}
              </div>
              {detail.invitations.length ? (
                <div className="mt-4 rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                  {detail.invitations.length} invitation masih aktif. Terakhir diperbarui {formatDateTime(detail.organization.updatedAt)}.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
