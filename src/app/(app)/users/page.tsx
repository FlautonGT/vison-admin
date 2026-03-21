"use client";

import { useEffect, useState } from "react";
import { Ban, RefreshCw, ShieldCheck, UserRoundX } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { AdminUser } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await adminApi.getUsers({ query, status, page: 1, perPage: 50 });
    setUsers(response.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // load depends on filter state and is intentionally invoked from this effect.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  useEffect(() => {
    if (!users.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !users.some((user) => user.id === selectedId)) {
      setSelectedId(users[0].id);
    }
  }, [selectedId, users]);

  const selectedUser = users.find((user) => user.id === selectedId) || null;

  async function handleModeration() {
    if (!selectedUser) return;
    if (reason.trim().length < 5) {
      setNotice("Reason minimal 5 karakter.");
      return;
    }

    setSubmitting(true);
    const response =
      selectedUser.status === "suspended"
        ? await adminApi.unbanUser(selectedUser.id, reason)
        : await adminApi.banUser(selectedUser.id, reason);
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setReason("");
    setNotice(selectedUser.status === "suspended" ? "User berhasil di-unban." : "User berhasil di-ban.");
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard
        title="User Moderation"
        eyebrow="Global Directory"
        description="Cari user, lihat posture akun, dan lakukan moderasi cepat dengan reason yang tercatat."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_200px]">
          <input
            className="input-shell"
            placeholder="Cari email atau nama lengkap..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="select-shell" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Semua status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_email">Pending Email</option>
          </select>
        </div>

        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading users...</div>
        ) : users.length === 0 ? (
          <EmptyState title="Tidak ada user yang cocok" description="Ubah filter atau tunggu data user baru masuk." />
        ) : (
          <div className="table-shell overflow-hidden rounded-[24px] border border-[var(--border-soft)]">
            <table className="min-w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Security</th>
                  <th className="px-4 py-3 text-left">Organizations</th>
                  <th className="px-4 py-3 text-left">Created</th>
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
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <p>Email {user.emailVerified ? "verified" : "not verified"}</p>
                        <p>2FA {user.twoFactorEnabled ? "enabled" : "disabled"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.organizationCount}</td>
                    <td className="px-4 py-3">{formatRelativeTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Selected User"
        eyebrow="Action Panel"
        description="Detail singkat user dan kontrol moderasi paling sering dipakai tim support."
      >
        {!selectedUser ? (
          <EmptyState title="Pilih user terlebih dahulu" description="Klik salah satu baris di tabel untuk membuka action panel." />
        ) : (
          <div className="space-y-5">
            <div className="surface-soft p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">{selectedUser.fullName}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedUser.email}</p>
                </div>
                <StatusBadge label={selectedUser.status} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Security</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Email {selectedUser.emailVerified ? "verified" : "not verified"}.
                    <br />
                    2FA {selectedUser.twoFactorEnabled ? "enabled" : "disabled"}.
                    <br />
                    KYC {selectedUser.kycVerified ? "verified" : "not verified"}.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Membership</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Terhubung ke <span className="font-semibold text-[var(--text-primary)]">{selectedUser.organizationCount}</span> organization.
                    <br />
                    Dibuat pada {formatDateTime(selectedUser.createdAt)}.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                {selectedUser.status === "suspended" ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                ) : (
                  <UserRoundX className="h-5 w-5 text-rose-300" />
                )}
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    {selectedUser.status === "suspended" ? "Unban User" : "Ban User"}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">Reason akan masuk ke admin audit log.</p>
                </div>
              </div>
              <textarea
                className="textarea-shell mt-4 min-h-[140px]"
                placeholder="Tuliskan alasan tindakan ini..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              {notice ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {notice}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleModeration} className="button-primary" disabled={submitting}>
                  {selectedUser.status === "suspended" ? <RefreshCw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {submitting ? "Processing..." : selectedUser.status === "suspended" ? "Unban sekarang" : "Ban sekarang"}
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
