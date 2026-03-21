"use client";

import { useEffect, useState } from "react";
import { Building2, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { AdminOrganization } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await adminApi.getOrganizations({ query, status, page: 1, perPage: 50 });
    setOrganizations(response.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // load depends on filter state and is intentionally invoked from this effect.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  useEffect(() => {
    if (!organizations.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !organizations.some((org) => org.id === selectedId)) {
      setSelectedId(organizations[0].id);
    }
  }, [organizations, selectedId]);

  const selectedOrg = organizations.find((org) => org.id === selectedId) || null;

  async function handleAction(action: "deactivate" | "reactivate" | "delete") {
    if (!selectedOrg) return;
    if (reason.trim().length < 5) {
      setNotice("Reason minimal 5 karakter.");
      return;
    }

    setSubmitting(true);
    const response =
      action === "deactivate"
        ? await adminApi.deactivateOrganization(selectedOrg.id, reason)
        : action === "reactivate"
          ? await adminApi.reactivateOrganization(selectedOrg.id, reason)
          : await adminApi.deleteOrganization(selectedOrg.id, reason, confirmName);
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setReason("");
    setConfirmName("");
    setNotice(
      action === "delete"
        ? "Organization berhasil di-delete secara soft delete."
        : action === "deactivate"
          ? "Organization berhasil di-deactivate."
          : "Organization berhasil di-reactivate."
    );
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard
        title="Organization Control"
        eyebrow="Platform Tenants"
        description="Pantau status tenant, owner, balance, dan volume usage mingguan sebelum melakukan aksi."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            className="input-shell"
            placeholder="Cari nama organization atau owner..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="select-shell" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Semua status</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading organizations...</div>
        ) : organizations.length === 0 ? (
          <EmptyState title="Tidak ada organization yang cocok" description="Ubah filter atau tunggu tenant baru masuk." />
        ) : (
          <div className="table-shell overflow-hidden rounded-[24px] border border-[var(--border-soft)]">
            <table className="min-w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left">Organization</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Balance</th>
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
                      <StatusBadge label={organization.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p>{organization.ownerName || "-"}</p>
                      <p className="text-[var(--text-dim)]">{organization.ownerEmail || "-"}</p>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(organization.balanceAmount)}</td>
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
        eyebrow="Action Panel"
        description="Panel cepat untuk pause, restore, dan soft delete tenant dari workspace yang sama."
      >
        {!selectedOrg ? (
          <EmptyState title="Pilih organization" description="Klik salah satu organization dari tabel untuk membuka detail." />
        ) : (
          <div className="space-y-5">
            <div className="surface-soft p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">{selectedOrg.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedOrg.ownerEmail || "Owner email belum tersedia"}</p>
                </div>
                <StatusBadge label={selectedOrg.status} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Commercial</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Tier {selectedOrg.pricingTier}.
                    <br />
                    Discount {selectedOrg.discountPercent}%.
                    <br />
                    Balance {formatCurrency(selectedOrg.balanceAmount)}.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Usage Footprint</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {selectedOrg.memberCount} members.
                    <br />
                    {selectedOrg.apiKeyCount} API keys.
                    <br />
                    {formatNumber(selectedOrg.requestsLast7Days)} requests in 7 days.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                Dibuat {formatDateTime(selectedOrg.createdAt)} dan terakhir terlihat aktif {formatRelativeTime(selectedOrg.createdAt)}.
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Destructive Controls</p>
                  <p className="text-sm text-[var(--text-muted)]">Gunakan reason yang jelas. Soft delete juga minta konfirmasi nama.</p>
                </div>
              </div>

              <textarea
                className="textarea-shell mt-4 min-h-[110px]"
                placeholder="Reason untuk tindakan organisasi..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <input
                className="input-shell mt-3"
                placeholder="Ketik nama organization untuk delete confirmation"
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
              />
              {notice ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {notice}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {selectedOrg.status !== "deactivated" ? (
                  <button type="button" className="button-secondary" disabled={submitting} onClick={() => handleAction("deactivate")}>
                    <PauseCircle className="h-4 w-4" />
                    Deactivate
                  </button>
                ) : (
                  <button type="button" className="button-primary" disabled={submitting} onClick={() => handleAction("reactivate")}>
                    <PlayCircle className="h-4 w-4" />
                    Reactivate
                  </button>
                )}
                <button type="button" className="button-danger" disabled={submitting} onClick={() => handleAction("delete")}>
                  <Trash2 className="h-4 w-4" />
                  Soft Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
