"use client";

import { useEffect, useState } from "react";
import { FileClock, Send } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/utils";
import type { AdminOrganization, ComplianceRequest } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function CompliancePage() {
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [requests, setRequests] = useState<ComplianceRequest[]>([]);
  const [requestType, setRequestType] = useState("org_export");
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [reason, setReason] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [payloadText, setPayloadText] = useState("{\n  \"source\": \"admin_panel\"\n}");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [orgResponse, requestResponse] = await Promise.all([
      adminApi.getOrganizations({ page: 1, perPage: 100 }),
      adminApi.getComplianceRequests(),
    ]);
    setOrganizations(orgResponse.data ?? []);
    setRequests(requestResponse.data?.requests ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!orgId && !userId) {
      setNotice("Isi org atau user target minimal salah satu.");
      return;
    }
    if (reason.trim().length < 5) {
      setNotice("Reason minimal 5 karakter.");
      return;
    }

    let parsedPayload: Record<string, unknown> = {};
    if (payloadText.trim()) {
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch {
        setNotice("Payload JSON tidak valid.");
        return;
      }
    }

    setSubmitting(true);
    setNotice(null);
    const response = await adminApi.createComplianceRequest({
      requestType,
      orgId,
      userId,
      requesterEmail,
      reason,
      dueAt: dueAt ? new Date(dueAt).toISOString() : "",
      payload: parsedPayload,
    });
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setNotice("Compliance request berhasil dibuat.");
    setReason("");
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        title="Create Compliance Request"
        eyebrow="GDPR / PDP Workflow"
        description="Buat request export atau deletion untuk kebutuhan legal, audit, atau support escalation."
      >
        <div className="space-y-4">
          <select className="select-shell" value={requestType} onChange={(event) => setRequestType(event.target.value)}>
            <option value="org_export">Organization Export</option>
            <option value="org_deletion">Organization Deletion</option>
            <option value="user_deletion">User Deletion</option>
            <option value="data_purge">Data Purge</option>
          </select>
          <select className="select-shell" value={orgId} onChange={(event) => setOrgId(event.target.value)}>
            <option value="">Target organization (optional)</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <input className="input-shell" placeholder="Target user ID (optional)" value={userId} onChange={(event) => setUserId(event.target.value)} />
          <input
            className="input-shell"
            placeholder="Requester email"
            value={requesterEmail}
            onChange={(event) => setRequesterEmail(event.target.value)}
          />
          <input type="datetime-local" className="input-shell" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          <textarea
            className="textarea-shell min-h-[120px]"
            placeholder="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <textarea
            className="textarea-shell min-h-[180px] font-mono text-sm"
            placeholder="Payload JSON"
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
          />
          {notice ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">{notice}</div>
          ) : null}
          <button type="button" className="button-primary w-full" disabled={submitting} onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Create request"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Compliance Queue"
        eyebrow="Current Cases"
        description="Semua request legal/compliance yang masih berjalan atau sudah diproses."
      >
        {requests.length === 0 ? (
          <EmptyState title="Belum ada compliance request" description="Gunakan composer di kiri untuk membuat request pertama." />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge label={request.status} />
                  <p className="text-sm text-[var(--text-dim)]">{request.request_type}</p>
                  {request.org_name ? <p className="text-sm text-[var(--text-dim)]">{request.org_name}</p> : null}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--text-primary)]">{request.reason}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                      Requester: {request.requester_email || request.requested_by_email || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                    <FileClock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-dim)]">
                  <span>Created {formatDateTime(request.created_at)}</span>
                  <span>Due {formatDateTime(request.due_at)}</span>
                  <span>Resolved {formatDateTime(request.resolved_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
