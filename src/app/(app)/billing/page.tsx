"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Landmark } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AdminOrganization, BillingTransactionRow } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function BillingPage() {
  const [transactions, setTransactions] = useState<BillingTransactionRow[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("50000");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [txResponse, orgResponse] = await Promise.all([
      adminApi.getBillingTransactions(120),
      adminApi.getOrganizations({ page: 1, perPage: 100 }),
    ]);
    setTransactions(txResponse.data?.transactions ?? []);
    setOrganizations(orgResponse.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedOrgId && organizations.length) {
      const lowBalance = organizations.find((org) => org.balanceAmount < 10000) ?? organizations[0];
      setSelectedOrgId(lowBalance.id);
    }
  }, [organizations, selectedOrgId]);

  const selectedOrg = useMemo(() => organizations.find((org) => org.id === selectedOrgId) ?? null, [organizations, selectedOrgId]);

  async function handleAdjust() {
    if (!selectedOrgId) {
      setNotice("Pilih organization terlebih dahulu.");
      return;
    }
    if (reason.trim().length < 5) {
      setNotice("Reason minimal 5 karakter.");
      return;
    }
    setSubmitting(true);
    const response = await adminApi.adjustBalance({
      orgId: selectedOrgId,
      type,
      amount: Number(amount || 0),
      description: description || `Manual ${type} adjustment`,
      reason,
    });
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setNotice(`Adjustment berhasil. Saldo baru ${formatCurrency(response.data?.newBalance || 0)}.`);
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard
        title="Billing Ledger"
        eyebrow="Finance Desk"
        description="Pantau transaksi saldo terbaru, org dengan saldo rendah, lalu lakukan credit/debit manual dari panel yang sama."
      >
        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading billing ledger...</div>
        ) : transactions.length === 0 ? (
          <EmptyState title="Belum ada transaksi saldo" description="Ledger akan terisi setelah ada topup, billing debit, atau adjustment." />
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 18).map((transaction) => (
              <div key={transaction.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{transaction.orgName}</p>
                    <p className="text-sm text-[var(--text-dim)]">{transaction.description || transaction.serviceType || "Manual ledger entry"}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge label={transaction.type} />
                    <p className="mt-2 font-semibold text-[var(--text-primary)]">{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-[var(--text-dim)]">Balance after {formatCurrency(transaction.balanceAfter)}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[var(--text-dim)]">{formatDateTime(transaction.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Manual Adjustment"
        eyebrow="Credit / Debit"
        description="Gunakan adjustment untuk koreksi saldo, goodwill credit, chargeback, atau incident recovery."
      >
        <div className="space-y-5">
          <div className="surface-soft p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Adjustment Form</p>
                <p className="text-sm text-[var(--text-muted)]">Pilih org, jumlah, deskripsi, lalu sertakan reason yang jelas.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <select className="select-shell" value={selectedOrgId} onChange={(event) => setSelectedOrgId(event.target.value)}>
                <option value="">Pilih organization</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name} • {formatCurrency(organization.balanceAmount)}
                  </option>
                ))}
              </select>
              <select className="select-shell" value={type} onChange={(event) => setType(event.target.value as "credit" | "debit")}>
                <option value="credit">credit</option>
                <option value="debit">debit</option>
              </select>
              <input className="input-shell" type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} />
              <input
                className="input-shell"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Deskripsi adjustment"
              />
              <textarea
                className="textarea-shell min-h-[120px]"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason audit log untuk adjustment ini..."
              />
              <button type="button" className="button-primary" disabled={submitting} onClick={handleAdjust}>
                <Coins className="h-4 w-4" />
                {submitting ? "Processing..." : "Apply adjustment"}
              </button>
            </div>
          </div>

          {selectedOrg ? (
            <div className="surface-soft p-5 text-sm text-[var(--text-secondary)]">
              Org terpilih <span className="font-semibold text-[var(--text-primary)]">{selectedOrg.name}</span> dengan saldo saat ini{" "}
              <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(selectedOrg.balanceAmount)}</span>.
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">{notice}</div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
