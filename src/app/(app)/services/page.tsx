"use client";

import { useEffect, useMemo, useState } from "react";
import { ListTree, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { formatCurrency, formatDateTime, getServiceLabel } from "@/lib/utils";
import type { ServicePricingRow } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";

export default function ServicesPage() {
  const [services, setServices] = useState<ServicePricingRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await adminApi.getPricing();
    setServices(response.data?.pricing ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!services.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !services.some((service) => service.serviceType === selectedId)) {
      setSelectedId(services[0].serviceType);
    }
  }, [selectedId, services]);

  const selectedService = useMemo(
    () => services.find((service) => service.serviceType === selectedId) ?? null,
    [selectedId, services]
  );

  useEffect(() => {
    if (!selectedService) return;
    setDisplayName(selectedService.displayName);
    setPrice(`${selectedService.price}`);
    setIsActive(selectedService.isActive);
  }, [selectedService]);

  async function handleSave() {
    if (!selectedService) return;
    setSubmitting(true);
    const response = await adminApi.updatePricing(selectedService.serviceType, {
      displayName,
      price: Number(price || 0),
      isActive,
    });
    setSubmitting(false);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setNotice("Service pricing berhasil diperbarui.");
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="Service Catalog"
        eyebrow="Pricing & Availability"
        description="Atur nama service, harga, dan availability global untuk semua layanan yang ditagihkan."
      >
        {loading ? (
          <div className="surface-soft p-6 text-sm text-[var(--text-muted)]">Loading service catalog...</div>
        ) : services.length === 0 ? (
          <EmptyState title="Belum ada service pricing" description="Seed pricing belum tersedia atau database belum terisi." />
        ) : (
          <div className="grid gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedId(service.serviceType)}
                className={`rounded-[24px] border px-5 py-4 text-left transition ${
                  selectedId === service.serviceType
                    ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                    : "border-[var(--border-soft)] bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{service.displayName}</p>
                    <p className="text-sm text-[var(--text-dim)]">{getServiceLabel(service.serviceType)} • {service.serviceType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge label={service.isActive ? "active" : "inactive"} />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(service.price)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Selected Service"
        eyebrow="Catalog Editor"
        description="Editor ringan untuk rename layanan, update harga, dan menonaktifkan service dari admin console."
      >
        {!selectedService ? (
          <EmptyState title="Pilih service terlebih dahulu" description="Klik salah satu service dari panel kiri untuk mulai edit." />
        ) : (
          <div className="space-y-5">
            <div className="surface-soft p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-strong)]">
                  <ListTree className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--text-primary)]">{selectedService.displayName}</p>
                  <p className="text-sm text-[var(--text-muted)]">{selectedService.serviceType}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <input className="input-shell" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                <input className="input-shell" type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} />
                <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border-soft)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                  Service aktif untuk transaksi baru
                </label>
                <button type="button" className="button-primary" disabled={submitting} onClick={handleSave}>
                  <RefreshCw className="h-4 w-4" />
                  {submitting ? "Saving..." : "Save service"}
                </button>
              </div>
              {notice ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="surface-soft p-5 text-sm text-[var(--text-secondary)]">
              Last updated {formatDateTime(selectedService.updatedAt)}. Harga live saat ini {formatCurrency(selectedService.price)}.
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
