"use client";

import { useEffect, useState } from "react";
import { BellPlus, PencilLine, Save, Send } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import type { Announcement } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("info");
  const [targetAllOrgs, setTargetAllOrgs] = useState(true);
  const [targetOrgIds, setTargetOrgIds] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const response = await adminApi.getAnnouncements();
    const rows = response.data?.announcements ?? [];
    setAnnouncements(rows);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setSelected(null);
    setTitle("");
    setBody("");
    setSeverity("info");
    setTargetAllOrgs(true);
    setTargetOrgIds("");
    setShowBanner(true);
    setSendInApp(true);
    setSendEmail(false);
    setMaintenanceMode(false);
    setIsActive(true);
    setStartsAt("");
    setEndsAt("");
  }

  function populateForm(row: Announcement) {
    setSelected(row);
    setTitle(row.title);
    setBody(row.body);
    setSeverity(row.severity);
    setTargetAllOrgs(row.targetAllOrgs);
    setTargetOrgIds(row.targetOrgIds?.join(", ") || "");
    setShowBanner(row.showBanner);
    setSendInApp(row.sendInApp);
    setSendEmail(row.sendEmail);
    setMaintenanceMode(row.maintenanceMode);
    setIsActive(row.isActive);
    setStartsAt(toLocalDateTime(row.startsAt));
    setEndsAt(toLocalDateTime(row.endsAt));
  }

  async function handleSubmit() {
    if (title.trim().length < 3 || body.trim().length < 5) {
      setNotice("Title minimal 3 karakter dan body minimal 5 karakter.");
      return;
    }

    setSubmitting(true);
    setNotice(null);
    const payload = {
      title,
      body,
      severity,
      targetAllOrgs,
      targetOrgIds: targetOrgIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      showBanner,
      sendInApp,
      sendEmail,
      maintenanceMode,
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : "",
      endsAt: endsAt ? new Date(endsAt).toISOString() : "",
    };

    const response = selected
      ? await adminApi.updateAnnouncement(selected.id, payload)
      : await adminApi.createAnnouncement(payload);
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setNotice(selected ? "Announcement berhasil di-update." : "Announcement berhasil dibuat.");
    resetForm();
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title={selected ? "Edit Announcement" : "Create Announcement"}
        eyebrow="Notification Center"
        description="Kelola maintenance notice, banner in-app, dan urgent blast dari satu panel."
        actions={
          <button type="button" className="button-secondary" onClick={resetForm}>
            <BellPlus className="h-4 w-4" />
            New draft
          </button>
        }
      >
        <div className="space-y-4">
          <input className="input-shell" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea
            className="textarea-shell min-h-[180px]"
            placeholder="Isi pengumuman atau maintenance notice..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select className="select-shell" value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <input
              className="input-shell"
              placeholder="Target org IDs (comma separated)"
              value={targetOrgIds}
              onChange={(event) => setTargetOrgIds(event.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="datetime-local" className="input-shell" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
            <input type="datetime-local" className="input-shell" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Target all orgs", targetAllOrgs, setTargetAllOrgs],
              ["Show banner", showBanner, setShowBanner],
              ["Send in-app", sendInApp, setSendInApp],
              ["Send email", sendEmail, setSendEmail],
              ["Maintenance mode", maintenanceMode, setMaintenanceMode],
              ["Active now", isActive, setIsActive],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="flex items-center justify-between rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-[var(--text-secondary)]">{label as string}</span>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(event) => (setter as (next: boolean) => void)(event.target.checked)}
                />
              </label>
            ))}
          </div>
          {notice ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">{notice}</div>
          ) : null}
          <button type="button" className="button-primary w-full" disabled={submitting} onClick={handleSubmit}>
            {selected ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {submitting ? "Saving..." : selected ? "Update announcement" : "Create announcement"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Announcement Feed"
        eyebrow="Recent Broadcasts"
        description="Lihat notice aktif, maintenance schedule, dan draft yang terakhir diperbarui."
      >
        {announcements.length === 0 ? (
          <EmptyState title="Belum ada announcement" description="Composer di kiri siap dipakai untuk broadcast pertama." />
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <button
                key={announcement.id}
                type="button"
                className="w-full rounded-[24px] border border-[var(--border-soft)] bg-white/[0.03] p-5 text-left transition hover:-translate-y-0.5"
                onClick={() => populateForm(announcement)}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge label={announcement.severity} mode="severity" />
                  <StatusBadge label={announcement.isActive ? "active" : "draft"} />
                  {announcement.maintenanceMode ? <StatusBadge label="maintenance" /> : null}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--text-primary)]">{announcement.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">{announcement.body}</p>
                  </div>
                  <PencilLine className="h-5 w-5 shrink-0 text-[var(--text-dim)]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-dim)]">
                  <span>{announcement.targetAllOrgs ? "All orgs" : `${announcement.targetOrgCount || 0} target orgs`}</span>
                  <span>{announcement.sendEmail ? "Email blast enabled" : "In-app only"}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
