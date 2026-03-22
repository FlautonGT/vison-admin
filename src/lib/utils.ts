import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "-";
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor((now - then) / 60000));
  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDateTime(value);
}

export function getInitials(name?: string | null) {
  if (!name) return "VA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getServiceLabel(serviceType?: string | null) {
  if (!serviceType) return "Unknown";
  const map: Record<string, string> = {
    ocr: "OCR",
    liveness: "Liveness",
    identity: "Identity",
    validate_nik: "Identity",
    face_compare: "Face Match",
    face_match: "Face Match",
    watchlist: "Watchlist",
  };
  const normalized = serviceType.trim().toLowerCase();
  return (
    map[normalized] ||
    normalized
      .split("_")
      .filter(Boolean)
      .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
      .join(" ")
  );
}

export function statusTone(status?: string | null) {
  const normalized = (status || "").toLowerCase();
  if (["active", "approved", "resolved", "completed", "executed", "credit"].includes(normalized)) return "success";
  if (["warning", "investigating", "pending", "in_review", "submitted", "needs_review"].includes(normalized)) {
    return "warning";
  }
  if (["critical", "suspended", "deleted", "deactivated", "rejected", "ignored", "failed", "debit"].includes(normalized)) {
    return "danger";
  }
  if (normalized === "info") return "info";
  return "neutral";
}

export function severityTone(severity?: string | null) {
  return statusTone(severity);
}

export function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}
