"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, KeyRound, MailCheck, RefreshCw, ShieldCheck, UserCog } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime, formatRelativeTime, safeJsonStringify } from "@/lib/utils";
import type { AdminUser, AdminUserDetail } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

const userStatusOptions = ["pending_email", "active", "suspended"] as const;
const kycStatusOptions = ["not_started", "submitted", "needs_review", "approved", "rejected"] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [statusDraft, setStatusDraft] = useState<string>("active");
  const [kycStatusDraft, setKycStatusDraft] = useState<string>("not_started");
  const [kycReviewNotes, setKycReviewNotes] = useState("");
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const response = await adminApi.getUsers({ query, status, kycStatus, page: 1, perPage: 50 });
    setUsers(response.data ?? []);
    setLoading(false);
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    const response = await adminApi.getUserDetail(id);
    setDetail(response.data ?? null);
    setDetailLoading(false);
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, kycStatus]);

  useEffect(() => {
    if (!users.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !users.some((user) => user.id === selectedId)) {
      setSelectedId(users[0].id);
    }
  }, [selectedId, users]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!detail?.user) return;
    setStatusDraft(detail.user.status);
    setKycStatusDraft(detail.user.kycStatus);
    setKycReviewNotes(detail.user.kycReviewNotes ?? "");
  }, [detail]);

  const selectedUser = users.find((user) => user.id === selectedId) ?? null;

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
    await loadUsers();
    if (selectedId) {
      await loadDetail(selectedId);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard
        title="User Control Center"
        eyebrow="Identity & Access"
        description="Cari user, lihat posture keamanan, status KYC, dan jalankan support action tanpa pindah context."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <input
            className="input-shell"
            placeholder="Cari email atau nama lengkap..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="select-shell" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Semua status akun</option>
            {userStatusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="select-shell" value={kycStatus} onChange={(event) => setKycStatus(event.target.value)}>
            <option value="">Semua status KYC</option>
            {kycStatusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading users...</div>
        ) : users.length === 0 ? (
          <EmptyState title="Tidak ada user yang cocok" description="Coba ubah filter atau tunggu data user baru masuk." />
        ) : (
          <div className="table-shell overflow-hidden rounded-[24px] border border-[var(--border-soft)]">
            <table className="min-w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">KYC</th>
                  <th className="px-4 py-3 text-left">Security</th>
                  <th className="px-4 py-3 text-left">Organizations</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={selectedId === user.id ? "bg-emerald-400/[0.06]" : "cursor-pointer hover:bg-white/[0.03]"}
                    onClick={() => setSelectedId(user.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--text-primary)]">{user.fullName}</p>
                      <p className="text-sm text-[var(--text-dim)]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={user.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <StatusBadge label={user.kycStatus} />
                        <span className="text-xs text-[var(--text-dim)]">{user.kycVerified ? "KYC verified" : "Belum verified"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <p>Email {user.emailVerified ? "verified" : "not verified"}</p>
                      <p>2FA {user.twoFactorEnabled ? "enabled" : "disabled"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--text-secondary)]">{user.organizationCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Selected User"
        eyebrow="Support Desk"
        description="Panel ini menyatukan status akun, verification controls, dan payload KYC supaya review lebih cepat."
      >
        {!selectedUser ? (
          <EmptyState title="Pilih user terlebih dahulu" description="Klik salah satu baris user untuk membuka workspace support." />
        ) : detailLoading || !detail ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading user detail...</div>
        ) : (
          <div className="space-y-5">
            <div className="surface-soft p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">{detail.user.fullName}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{detail.user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge label={detail.user.status} />
                  <StatusBadge label={detail.user.kycStatus} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Identity</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Phone {detail.user.phone || "-"}.
                    <br />
                    Created {formatDateTime(detail.user.createdAt)}.
                    <br />
                    Last updated {formatRelativeTime(detail.user.updatedAt)}.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Security</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Email {detail.user.emailVerifiedAt ? "verified" : "not verified"}.
                    <br />
                    2FA {detail.user.totpEnabledAt ? "enabled" : "disabled"}.
                    <br />
                    KYC verified {detail.user.kycVerifiedAt ? formatRelativeTime(detail.user.kycVerifiedAt) : "belum"}.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Support Actions</p>
                  <p className="text-sm text-[var(--text-muted)]">Semua tindakan di bawah akan memakai reason yang sama dan masuk audit log.</p>
                </div>
              </div>

              <textarea
                className="textarea-shell mt-4 min-h-[110px]"
                placeholder="Reason untuk perubahan status, verification, atau reset 2FA..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Account Status</p>
                  <select className="select-shell mt-3" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                    {userStatusOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="button-primary mt-3"
                    disabled={submittingKey === "status"}
                    onClick={() =>
                      runAction(
                        "status",
                        () => adminApi.updateUserStatus(detail.user.id, statusDraft, reason),
                        "Status user berhasil diperbarui."
                      )
                    }
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {submittingKey === "status" ? "Saving..." : "Save status"}
                  </button>
                </div>

                <div className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Trust Controls</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={submittingKey === "verify-email"}
                      onClick={() =>
                        runAction(
                          "verify-email",
                          () => adminApi.forceVerifyUserEmail(detail.user.id, reason),
                          "Email user ditandai verified."
                        )
                      }
                    >
                      <MailCheck className="h-4 w-4" />
                      {submittingKey === "verify-email" ? "Processing..." : "Verify email"}
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={submittingKey === "reset-2fa"}
                      onClick={() =>
                        runAction("reset-2fa", () => adminApi.resetUser2FA(detail.user.id, reason), "2FA user berhasil di-reset.")
                      }
                    >
                      <KeyRound className="h-4 w-4" />
                      {submittingKey === "reset-2fa" ? "Processing..." : "Reset 2FA"}
                    </button>
                  </div>
                </div>
              </div>

              {notice ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">KYC Review</p>
                  <p className="text-sm text-[var(--text-muted)]">Gunakan status review eksplisit agar tim support dan compliance lihat konteks yang sama.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <select className="select-shell" value={kycStatusDraft} onChange={(event) => setKycStatusDraft(event.target.value)}>
                  {kycStatusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea-shell min-h-[120px]"
                  placeholder="Catatan review KYC, mismatch, atau instruksi resubmission..."
                  value={kycReviewNotes}
                  onChange={(event) => setKycReviewNotes(event.target.value)}
                />
                <button
                  type="button"
                  className="button-primary"
                  disabled={submittingKey === "kyc-review"}
                  onClick={() =>
                    runAction(
                      "kyc-review",
                      () => adminApi.reviewUserKYC(detail.user.id, { status: kycStatusDraft, reviewNotes: kycReviewNotes, reason }),
                      "KYC user berhasil diperbarui."
                    )
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                  {submittingKey === "kyc-review" ? "Saving..." : "Save KYC review"}
                </button>
              </div>

              <div className="mt-4 rounded-[22px] border border-[var(--border-soft)] bg-black/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">KYC Payload</p>
                <pre className="mt-3 overflow-x-auto text-xs text-[var(--text-secondary)]">
                  {safeJsonStringify(detail.user.kycData ?? { message: "Belum ada payload KYC." })}
                </pre>
              </div>
            </div>

            <div className="surface-soft p-5">
              <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Organization Membership</p>
              {detail.organizations.length === 0 ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-white/10 px-4 py-5 text-sm text-[var(--text-muted)]">
                  User ini belum tergabung ke organization mana pun.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {detail.organizations.map((membership) => (
                    <div key={membership.orgId} className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{membership.orgName}</p>
                          <p className="text-sm text-[var(--text-dim)]">
                            {membership.memberRole} • {membership.orgType}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <StatusBadge label={membership.memberStatus} />
                          <StatusBadge label={membership.orgStatus} />
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-[var(--text-secondary)]">Joined {formatDateTime(membership.joinedAt)}.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
