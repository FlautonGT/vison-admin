import type {
  ActionApprovalRow,
  AdminOrganization,
  AdminOrganizationDetail,
  AdminRoleRow,
  AdminSession,
  AdminUser,
  AdminUserDetail,
  ApiError,
  ApiResponse,
  AssignmentRow,
  AuditLogRow,
  Announcement,
  BillingTransactionRow,
  ComplianceRequest,
  DashboardTile,
  FraudAlert,
  FraudSuggestion,
  GlobalLogRow,
  LoginResponse,
  Overview,
  RateLimitMonitorItem,
  RateLimitOverrideRow,
  SavedView,
  SessionProfile,
  ServicePricingRow,
  TopService,
  VerificationQueueRow,
} from "@/types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "https://gateway.vison.id" : "http://localhost:8080")
).replace(/\/+$/, "");

const GO_NULLABLE_VALUE_KEYS = ["String", "Bool", "Int64", "Int32", "Int16", "Float64", "Time"] as const;

function normalizeApiPayload<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeApiPayload(item)) as T;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.Valid === "boolean") {
      const nullableKey = GO_NULLABLE_VALUE_KEYS.find((key) => key in record);
      if (nullableKey) {
        return (record.Valid ? normalizeApiPayload(record[nullableKey]) : null) as T;
      }
    }

    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, normalizeApiPayload(item)])) as T;
  }

  return value;
}

class AdminApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (typeof window === "undefined") return;
    if (token) {
      document.cookie = `session=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    } else {
      document.cookie = "session=; path=/; max-age=0";
    }
  }

  setRefreshToken(token: string | null) {
    this.refreshToken = token;
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("vison_admin_refresh_token", token);
    } else {
      localStorage.removeItem("vison_admin_refresh_token");
    }
  }

  getToken() {
    if (this.accessToken) return this.accessToken;
    if (typeof window === "undefined") return null;
    const cookies = document.cookie.split(";").map((item) => item.trim());
    const session = cookies.find((item) => item.startsWith("session="));
    return session ? session.split("=")[1] : null;
  }

  getRefreshToken() {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window === "undefined") return null;
    return localStorage.getItem("vison_admin_refresh_token");
  }

  logout() {
    this.setToken(null);
    this.setRefreshToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("vison_admin_profile");
      localStorage.removeItem("vison_admin_session");
    }
  }

  private isAuthEndpoint(endpoint: string) {
    return endpoint.startsWith("/v1/auth/");
  }

  private buildHeaders(headers?: HeadersInit): Record<string, string> {
    const nextHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };
    const token = this.getToken();
    if (token) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }
    return nextHeaders;
  }

  private async parseJsonSafe(response: Response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return normalizeApiPayload(JSON.parse(text) as ApiResponse<unknown>);
    } catch {
      return null;
    }
  }

  private clearAuthAndRedirect() {
    this.logout();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  private async doRefresh() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;
      const data = (await this.parseJsonSafe(response)) as ApiResponse<LoginResponse> | null;
      const nextAccessToken = data?.data?.accessToken ?? data?.data?.token;
      if (!nextAccessToken) return false;
      this.setToken(nextAccessToken);
      if (data?.data?.refreshToken) {
        this.setRefreshToken(data.data.refreshToken);
      }
      return true;
    } catch {
      return false;
    }
  }

  private async refreshAccessToken() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async fetchWithAutoRefresh(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<Response> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: this.buildHeaders(options.headers),
    });

    const shouldRefresh =
      response.status === 401 &&
      !isRetry &&
      !this.isAuthEndpoint(endpoint) &&
      !!this.getRefreshToken();

    if (!shouldRefresh) return response;

    const refreshed = await this.refreshAccessToken();
    if (!refreshed) {
      this.clearAuthAndRedirect();
      return response;
    }

    return this.fetchWithAutoRefresh(endpoint, options, true);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithAutoRefresh(endpoint, options);
      const data = (await this.parseJsonSafe(response)) as ApiResponse<T> | null;

      if (!response.ok) {
        const fallback: ApiError =
          data?.error ??
          ({
            code: response.status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED",
            message: response.statusText || "Request failed",
          } satisfies ApiError);

        return { error: fallback, meta: data?.meta };
      }

      return data ?? {};
    } catch (error) {
      return {
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async login(email: string, password: string) {
    const response = await this.request<LoginResponse>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const token = response.data?.accessToken ?? response.data?.token;
    if (token) this.setToken(token);
    if (response.data?.refreshToken) this.setRefreshToken(response.data.refreshToken);
    return response;
  }

  async getUserMe() {
    return this.request<SessionProfile>("/v1/user/me");
  }

  async getAdminMe() {
    return this.request<AdminSession>("/v1/admin/me");
  }

  async getOverview() {
    return this.request<{ overview: Overview; topServices: TopService[] }>("/v1/admin/overview");
  }

  async getUsers(params?: { query?: string; status?: string; kycStatus?: string; page?: number; perPage?: number }) {
    const search = new URLSearchParams();
    if (params?.query) search.set("query", params.query);
    if (params?.status) search.set("status", params.status);
    if (params?.kycStatus) search.set("kycStatus", params.kycStatus);
    if (params?.page) search.set("page", `${params.page}`);
    if (params?.perPage) search.set("perPage", `${params.perPage}`);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return this.request<AdminUser[]>(`/v1/admin/users${suffix}`);
  }

  async getUserDetail(id: string) {
    return this.request<AdminUserDetail>(`/v1/admin/users/${id}`);
  }

  async getOrganizations(params?: {
    query?: string;
    status?: string;
    kybStatus?: string;
    page?: number;
    perPage?: number;
  }) {
    const search = new URLSearchParams();
    if (params?.query) search.set("query", params.query);
    if (params?.status) search.set("status", params.status);
    if (params?.kybStatus) search.set("kybStatus", params.kybStatus);
    if (params?.page) search.set("page", `${params.page}`);
    if (params?.perPage) search.set("perPage", `${params.perPage}`);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return this.request<AdminOrganization[]>(`/v1/admin/organizations${suffix}`);
  }

  async getOrganizationDetail(id: string) {
    return this.request<AdminOrganizationDetail>(`/v1/admin/organizations/${id}`);
  }

  async updateUserStatus(id: string, status: string, reason: string) {
    return this.request(`/v1/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
    });
  }

  async banUser(id: string, reason: string) {
    return this.request(`/v1/admin/users/${id}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async unbanUser(id: string, reason: string) {
    return this.request(`/v1/admin/users/${id}/unban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async forceVerifyUserEmail(id: string, reason: string) {
    return this.request(`/v1/admin/users/${id}/verify-email`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async resetUser2FA(id: string, reason: string) {
    return this.request(`/v1/admin/users/${id}/reset-2fa`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reviewUserKYC(id: string, payload: { status: string; reviewNotes?: string; reason: string }) {
    return this.request(`/v1/admin/users/${id}/kyc-review`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deactivateOrganization(id: string, reason: string) {
    return this.request(`/v1/admin/organizations/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reactivateOrganization(id: string, reason: string) {
    return this.request(`/v1/admin/organizations/${id}/reactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async deleteOrganization(id: string, reason: string, confirmName: string) {
    return this.request(`/v1/admin/organizations/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason, confirmName }),
    });
  }

  async updateOrganizationCommercial(id: string, payload: { pricingTier: string; discountPercent: number; reason: string }) {
    return this.request(`/v1/admin/organizations/${id}/commercial`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async reviewOrganizationKYB(id: string, payload: { status: string; reviewNotes?: string; reason: string }) {
    return this.request(`/v1/admin/organizations/${id}/kyb-review`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getPricing() {
    return this.request<{ pricing: ServicePricingRow[] }>("/v1/admin/pricing");
  }

  async updatePricing(id: string, payload: { displayName: string; price: number; isActive: boolean }) {
    return this.request(`/v1/admin/pricing/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getBillingTransactions(limit = 120) {
    return this.request<{ transactions: BillingTransactionRow[] }>(`/v1/admin/billing/transactions?limit=${limit}`);
  }

  async adjustBalance(payload: { orgId: string; type: "credit" | "debit"; amount: number; description: string; reason: string }) {
    return this.request<{ message: string; newBalance: number }>(`/v1/admin/billing/adjustments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getKYCReviews(status?: string) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<{ items: VerificationQueueRow[] }>(`/v1/admin/verifications/kyc${suffix}`);
  }

  async getKYBReviews(status?: string) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<{ items: VerificationQueueRow[] }>(`/v1/admin/verifications/kyb${suffix}`);
  }

  async getAnnouncements() {
    return this.request<{ announcements: Announcement[] }>("/v1/admin/announcements");
  }

  async createAnnouncement(payload: Record<string, unknown>) {
    return this.request(`/v1/admin/announcements`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateAnnouncement(id: string, payload: Record<string, unknown>) {
    return this.request(`/v1/admin/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getRateLimitOverrides() {
    return this.request<{ overrides: RateLimitOverrideRow[] }>("/v1/admin/rate-limits");
  }

  async getRateLimitMonitor() {
    return this.request<{ monitor: RateLimitMonitorItem[] }>("/v1/admin/rate-limits/monitor");
  }

  async upsertRateLimitOverride(orgId: string, payload: Record<string, unknown>) {
    return this.request(`/v1/admin/rate-limits/${orgId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getComplianceRequests() {
    return this.request<{ requests: ComplianceRequest[] }>("/v1/admin/compliance/requests");
  }

  async createComplianceRequest(payload: Record<string, unknown>) {
    return this.request(`/v1/admin/compliance/requests`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getFraudPanel() {
    return this.request<{ alerts: FraudAlert[]; suggestions: FraudSuggestion[] }>("/v1/admin/fraud/alerts");
  }

  async updateFraudStatus(id: string, status: string, reason: string) {
    return this.request(`/v1/admin/fraud/alerts/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
    });
  }

  async getRoles() {
    return this.request<{ roles: AdminRoleRow[] }>("/v1/admin/rbac/roles");
  }

  async getAssignments() {
    return this.request<{ assignments: AssignmentRow[] }>("/v1/admin/rbac/assignments");
  }

  async getAuditLogs(params?: { page?: number; perPage?: number }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", `${params.page}`);
    if (params?.perPage) search.set("perPage", `${params.perPage}`);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return this.request<AuditLogRow[]>(`/v1/admin/audit-logs${suffix}`);
  }

  async getGlobalLogs(params?: {
    page?: number;
    perPage?: number;
    orgId?: string;
    environment?: string;
    service?: string;
    status?: string;
    requestId?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", `${params.page}`);
    if (params?.perPage) search.set("perPage", `${params.perPage}`);
    if (params?.orgId) search.set("orgId", params.orgId);
    if (params?.environment) search.set("environment", params.environment);
    if (params?.service) search.set("service", params.service);
    if (params?.status) search.set("status", params.status);
    if (params?.requestId) search.set("requestId", params.requestId);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return this.request<GlobalLogRow[]>(`/v1/admin/logs${suffix}`);
  }

  async getSavedViews() {
    return this.request<{ views: SavedView[] }>("/v1/admin/saved-views");
  }

  async getDashboardTiles() {
    return this.request<{ tiles: DashboardTile[] }>("/v1/admin/dashboard-tiles");
  }

  async getActionApprovals() {
    return this.request<{ approvals: ActionApprovalRow[] }>("/v1/admin/action-approvals");
  }
}

export const adminApi = new AdminApiClient();
