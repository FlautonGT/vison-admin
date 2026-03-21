export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ApiMeta {
  requestId?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  status?: string;
  emailVerifiedAt?: string | null;
}

export interface AdminSession {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];
  orgScopes: string[];
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: SessionProfile;
  requires2FA?: boolean;
  tempToken?: string;
}

export interface Overview {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
  deactivatedOrganizations: number;
  deletedOrganizations: number;
  lowBalanceOrganizations: number;
  requestsLast24Hours: number;
  errorsLast24Hours: number;
  openFraudAlerts: number;
  pendingComplianceRequests: number;
  pendingApprovals: number;
}

export interface TopService {
  serviceType: string;
  totalCalls: number;
  totalCost: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  emailVerified: boolean;
  kycVerified: boolean;
  twoFactorEnabled: boolean;
  organizationCount: number;
  createdAt: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  type: string;
  status: string;
  pricingTier: string;
  discountPercent: number;
  ownerName?: string | null;
  ownerEmail?: string | null;
  balanceAmount: number;
  memberCount: number;
  apiKeyCount: number;
  requestsLast7Days: number;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  targetAllOrgs: boolean;
  showBanner: boolean;
  sendInApp: boolean;
  sendEmail: boolean;
  maintenanceMode: boolean;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  targetOrgIds?: string[];
  targetOrgCount?: number;
}

export interface ComplianceRequest {
  id: string;
  request_type: string;
  status: string;
  org_id?: string | null;
  org_name?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  requester_email?: string | null;
  requested_by_email?: string | null;
  reason: string;
  request_payload?: unknown;
  review_notes?: string | null;
  due_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FraudAlert {
  id: string;
  org_id: string;
  org_name: string;
  api_key_id?: string | null;
  api_key_name?: string | null;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "investigating" | "resolved" | "ignored";
  title: string;
  description?: string | null;
  signal_data?: Record<string, unknown> | null;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at?: string | null;
  resolved_by_email?: string | null;
}

export interface FraudSuggestion {
  kind: string;
  severity: string;
  orgId?: string;
  apiKeyId?: string;
  title: string;
  description: string;
  signals?: Record<string, unknown>;
}

export interface RateLimitMonitorItem {
  orgId: string;
  orgName: string;
  requestsLast1m: number;
  requestsLast15m: number;
  errorCountLast15m: number;
  overrideRpm?: number | null;
  temporaryRpm?: number | null;
  temporaryUntil?: string | null;
}

export interface RateLimitOverrideRow {
  id: string;
  org_id: string;
  org_name: string;
  requests_per_minute?: number | null;
  burst_limit?: number | null;
  temporary_requests_per_minute?: number | null;
  temporary_burst_limit?: number | null;
  temporary_until?: string | null;
  notes?: string | null;
  updated_at: string;
}

export interface AdminRoleRow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
  is_active?: boolean;
}

export interface AssignmentRow {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  role_code: string;
  role_name: string;
  scope_type: "global" | "org";
  org_id?: string | null;
  org_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  action: string;
  actor_user_id?: string;
  actor_email?: string;
  target_type?: string | null;
  target_id?: string | null;
  reason?: string | null;
  request_id?: string | null;
  created_at: string;
}

export interface ActionApprovalRow {
  id: string;
  action_type: string;
  target_type: string;
  target_id?: string | null;
  org_id?: string | null;
  org_name?: string | null;
  reason: string;
  status: string;
  requested_by_email: string;
  approved_by_email?: string | null;
  approved_at?: string | null;
  executed_at?: string | null;
  created_at: string;
}

export interface SavedView {
  id: string;
  name: string;
  resource: string;
  filters?: unknown;
  isPinned: boolean;
  updatedAt: string;
}

export interface DashboardTile {
  id: string;
  tileKey: string;
  position: number;
  isEnabled: boolean;
  config?: unknown;
}
