/**
 * Typed Super Admin API client — every call goes through the Next.js `/api/*` proxies
 * with the admin bearer token. Endpoints mirror the app's
 * Bhansamart_frontend/src/store/services/adminService.ts.
 */
import { clearAdminSession, clearStaffAdminSession, getAdminToken, getStaffAdminToken, type AdminUser } from "./session";
import { inStaffConsole } from "./console";
import type {
  RefundClaim,
  RefundSummary,
  MapRider,
  MapVendor,
  AdminRider,
  CodReconRow,
  CodReconSummary,
  ProductPerformance,
  SalesAnalytics,
  QueueBrand,
  AuditLogEntry,
  AdminCustomerDetails,
  LedgerTxn,
  AdminCategory,
  AdminProduct,
  AdminCustomer,
  AdminDashboardStats,
  AdminPermissions,
  AdminTicket,
  AdminVendor,
  AdminVendorDetails,
  AdminWithdrawal,
  DailyTrend,
  Paged,
  PaymentBreakdownRow,
  StaffAdmin,
} from "./types";

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

const qs = (q?: Query) => {
  if (!q) return "";
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** Low-level request. Throws AdminApiError with the backend's message. 401 ends the admin session. */
export async function adminRequest<T = unknown>(
  path: string,
  opts: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; query?: Query; json?: unknown; form?: FormData } = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  // Same client for both consoles: the URL decides which session's token is sent
  const staff = inStaffConsole();
  const token = staff ? getStaffAdminToken() : getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}${qs(opts.query)}`, { method: opts.method || (body ? "POST" : "GET"), headers, body, cache: "no-store" });
  } catch {
    throw new AdminApiError("Network error. Please check your connection and try again.", 0);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  const payload = (data || {}) as { success?: boolean; message?: string; errors?: Array<{ message?: string }> };
  if ([502, 503, 504, 520, 521, 522, 523, 524].includes(res.status) && !payload.message) {
    throw new AdminApiError("Can't reach the BhansaMart server right now. Please try again in a few minutes.", res.status);
  }
  if (res.status === 401) {
    if (staff) clearStaffAdminSession();
    else clearAdminSession();
  }
  if (!res.ok || payload.success === false) {
    throw new AdminApiError(payload.message || payload.errors?.[0]?.message || `Request failed (${res.status}).`, res.status);
  }
  return data as T;
}

type Ok<T> = { success: true; message?: string } & T;
type PagedResponse<T> = Ok<{ data: T[]; total?: number; totalPages?: number; currentPage?: number; count?: number }>;
const paged = <T>(r: PagedResponse<T>): Paged<T> => ({
  data: r.data || [],
  total: r.total ?? r.count ?? r.data?.length ?? 0,
  totalPages: r.totalPages || 1,
  currentPage: r.currentPage || 1,
});

export const errorText = (err: unknown, fallback = "Something went wrong. Please try again.") =>
  err instanceof Error && err.message ? err.message : fallback;

// ─── Auth ────────────────────────────────────────────────────────────────

export interface AdminLoginResult {
  token: string;
  user: AdminUser;
}

/** Same endpoint as the app's admin login (POST /auth/login), role checked by the caller. */
export async function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  const r = await adminRequest<Ok<{ data: AdminLoginResult }>>("/auth/login", { method: "POST", json: { email, password } });
  return r.data;
}

export async function getAdminMe() {
  const r = await adminRequest<Ok<{ data: { user: AdminLoginResult["user"] } | AdminLoginResult["user"] }>>("/auth/me");
  const d = r.data as { user?: AdminLoginResult["user"] } & AdminLoginResult["user"];
  return d.user || d;
}

// ─── Dashboard ───────────────────────────────────────────────────────────

export async function getDashboardStats(query: { timeframe?: string } = {}): Promise<AdminDashboardStats> {
  const r = await adminRequest<Ok<{ data: AdminDashboardStats }>>("/admin/dashboard/stats", { query });
  return r.data;
}

export async function getDashboardCharts(days = 7): Promise<{ dailyTrends: DailyTrend[]; paymentBreakdown: PaymentBreakdownRow[] }> {
  const r = await adminRequest<Ok<{ data: { dailyTrends: DailyTrend[]; paymentBreakdown: PaymentBreakdownRow[] } }>>("/admin/dashboard/charts", { query: { days } });
  return { dailyTrends: r.data?.dailyTrends || [], paymentBreakdown: r.data?.paymentBreakdown || [] };
}

// ─── Vendors ─────────────────────────────────────────────────────────────

export async function getVendors(query: { search?: string; status?: string; verification?: string; page?: number; limit?: number } = {}) {
  return paged(await adminRequest<PagedResponse<AdminVendor>>("/admin/vendors", { query: { limit: 50, ...query } }));
}

export async function getVendorDetails(id: string): Promise<AdminVendorDetails> {
  const r = await adminRequest<Ok<{ data: AdminVendorDetails }>>(`/admin/vendors/${encodeURIComponent(id)}`);
  return r.data;
}

export async function setVendorVerification(id: string, verificationStatus: "approved" | "rejected" | "pending", reason?: string) {
  return adminRequest<Ok<{ data: AdminVendor }>>(`/admin/vendors/${encodeURIComponent(id)}/verification`, {
    method: "PATCH",
    json: { verificationStatus, reason },
  });
}

// ─── Staff admins ────────────────────────────────────────────────────────

export async function getStaffAdmins(): Promise<StaffAdmin[]> {
  const r = await adminRequest<Ok<{ data: StaffAdmin[] }>>("/admin/admins");
  return r.data || [];
}

export async function createStaffAdmin(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  assignedVendors: string[];
  adminPermissions: Partial<AdminPermissions>;
}) {
  return adminRequest<Ok<{ data: StaffAdmin }>>("/admin/admins", { method: "POST", json: input });
}

export async function updateStaffAdmin(
  id: string,
  input: { name?: string; phone?: string; assignedVendors?: string[]; adminPermissions?: Partial<AdminPermissions>; isActive?: boolean; newPassword?: string }
) {
  return adminRequest<Ok<{ data: StaffAdmin }>>(`/admin/admins/${encodeURIComponent(id)}`, { method: "PUT", json: input });
}

// ─── Customers ───────────────────────────────────────────────────────────

export async function getCustomers(query: { search?: string; page?: number; limit?: number } = {}) {
  return paged(await adminRequest<PagedResponse<AdminCustomer>>("/admin/customers", { query: { limit: 50, ...query } }));
}

// ─── Finance: withdrawals ────────────────────────────────────────────────

export async function getWithdrawals(status = "ALL"): Promise<AdminWithdrawal[]> {
  const r = await adminRequest<Ok<{ data: AdminWithdrawal[] }>>("/admin/finance/withdrawals", { query: { status } });
  return r.data || [];
}

export async function reviewWithdrawal(id: string, input: { action: "APPROVE" | "REJECT"; payoutReference?: string; reason?: string }) {
  return adminRequest<Ok<{ data: AdminWithdrawal }>>(`/admin/finance/withdrawals/${encodeURIComponent(id)}/review`, { method: "POST", json: input });
}

export async function createVendorWithdrawal(input: { vendorId: string; amount: number; notes?: string }) {
  return adminRequest<Ok<{ data: AdminWithdrawal }>>("/admin/finance/withdrawals", { method: "POST", json: input });
}

// ─── Tickets ─────────────────────────────────────────────────────────────

export async function getTickets(query: { status?: string; category?: string; priority?: string; page?: number; limit?: number } = {}) {
  return paged(await adminRequest<PagedResponse<AdminTicket>>("/admin/tickets", { query: { limit: 50, ...query } }));
}

// ─── Orders (app: staffadminScreens/OrdersScreen — reached from the dashboard) ──

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  vendor?: { _id: string; businessDetails?: { businessName?: string }; name?: string } | null;
  customer?: { _id: string; name?: string; phone?: string; email?: string } | null;
  assignedDeliveryBoy?: { _id: string; fullName?: string; phone?: string } | null;
  items?: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
}

export async function getPlatformOrders(query: { vendorId?: string; status?: string; search?: string; page?: number; limit?: number } = {}) {
  const r = await adminRequest<Ok<{ data: { orders: AdminOrder[]; total: number; page: number; pages: number } }>>("/admin/staff-operations/orders", { query: { limit: 50, ...query } });
  return { orders: r.data?.orders || [], total: r.data?.total || 0, pages: r.data?.pages || 1 };
}

// ─── Catalog ─────────────────────────────────────────────────────────────


export async function getCategories(): Promise<{ all: AdminCategory[]; root: AdminCategory[]; subs: AdminCategory[] }> {
  const r = await adminRequest<Ok<{ data: { all: AdminCategory[]; root: AdminCategory[]; subs: AdminCategory[] } }>>("/admin/categories");
  return { all: r.data?.all || [], root: r.data?.root || [], subs: r.data?.subs || [] };
}

export interface CategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  level?: number;
  parentCategory?: string | null;
  isActive?: boolean;
}

export const createCategory = (input: CategoryInput) => adminRequest<Ok<{ data: AdminCategory }>>("/admin/categories", { method: "POST", json: input });
export const updateCategory = (id: string, input: CategoryInput) =>
  adminRequest<Ok<{ data: AdminCategory }>>(`/admin/categories/${encodeURIComponent(id)}`, { method: "PUT", json: input });

export async function uploadCategoryImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const r = await adminRequest<Ok<{ data: { url: string } }>>("/admin/categories/upload-image", { method: "POST", form });
  return r.data.url;
}

export async function getProducts(query: { search?: string; category?: string; vendorId?: string; page?: number; limit?: number } = {}) {
  return paged(await adminRequest<PagedResponse<AdminProduct>>("/admin/products", { query: { limit: 15, ...query } }));
}

export async function getProduct(id: string): Promise<AdminProduct> {
  const r = await adminRequest<Ok<{ data: AdminProduct }>>(`/admin/products/${encodeURIComponent(id)}`);
  return r.data;
}

export const moderateProduct = (id: string, input: { name?: string; price?: number; stock?: number; category?: string; subCategory?: string; isActive?: boolean }) =>
  adminRequest<Ok<{ data: AdminProduct }>>(`/admin/products/${encodeURIComponent(id)}/moderate`, { method: "PATCH", json: input });

// ─── Finance: ledger & staff-operations withdrawal examination ───────────


export async function getLedger(query: { vendorId?: string; type?: string; search?: string; page?: number; limit?: number } = {}) {
  return paged(await adminRequest<PagedResponse<LedgerTxn>>("/admin/finance/transactions", { query: { limit: 25, ...query } }));
}

export async function getWithdrawalQueue(query: { vendorId?: string; status?: string; page?: number; limit?: number } = {}) {
  const r = await adminRequest<Ok<{ withdrawals: AdminWithdrawal[]; total: number; page: number; totalPages: number }>>("/admin/staff-operations/withdrawals", { query: { limit: 10, ...query } });
  return { withdrawals: r.withdrawals || [], total: r.total || 0, totalPages: r.totalPages || 1 };
}

/** Backend reads `escalationAction` (the app sends `escalationStatus`, which the backend ignores). */
export const examineWithdrawal = (id: string, input: { internalNotes?: string; escalationAction: "FORWARD_TO_FINANCE" | "REQUEST_INFO" | "REJECT"; rejectionReason?: string }) =>
  adminRequest<Ok<{ data: AdminWithdrawal }>>(`/admin/staff-operations/withdrawals/${encodeURIComponent(id)}/examine`, { method: "PATCH", json: input });

// ─── Platform bank & payment-method limits (superadmin only) ─────────────

export interface PaymentMethodConfig {
  methodKey: string;
  displayName: string;
  isEnabled: boolean;
  accountIdentifier?: string;
  qrCodeImageUrl?: string;
  minAmount?: number;
  maxAmount?: number;
  instructions?: string;
}
export interface PlatformPaymentConfig {
  bankDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    branchName?: string;
    ifscOrRoutingCode?: string;
    ifscCode?: string;
    upiId?: string;
    qrCodeImageUrl?: string;
    instructions?: string;
    isActive?: boolean;
  };
  enabledPaymentMethods?: PaymentMethodConfig[];
  paymentMethods?: Record<string, { isEnabled?: boolean; maxOrderAmount?: number }>;
  updatedAt?: string;
}

export async function getPaymentConfig(): Promise<PlatformPaymentConfig> {
  const r = await adminRequest<Ok<{ data: PlatformPaymentConfig }>>("/admin/platform-payment/config");
  return r.data || {};
}
export const updatePaymentConfig = (payload: PlatformPaymentConfig) =>
  adminRequest<Ok<{ data: PlatformPaymentConfig }>>("/admin/platform-payment/config", { method: "PUT", json: payload });

export async function getCustomerDetails(id: string): Promise<AdminCustomerDetails> {
  const r = await adminRequest<Ok<{ data: AdminCustomerDetails }>>(`/admin/staff-operations/customers/${encodeURIComponent(id)}`);
  return r.data;
}

export async function getTicket(id: string): Promise<AdminTicket> {
  const r = await adminRequest<Ok<{ data: AdminTicket }>>(`/admin/tickets/${encodeURIComponent(id)}`);
  return r.data;
}
export const replyTicket = (id: string, input: { message: string; status?: string }) =>
  adminRequest<Ok<{ data: AdminTicket }>>(`/admin/tickets/${encodeURIComponent(id)}/reply`, { method: "POST", json: input });

export async function getAuditLogs(query: { action?: string; targetResource?: string; page?: number; limit?: number } = {}) {
  return paged(await adminRequest<PagedResponse<AuditLogEntry>>("/admin/audit-logs", { query: { limit: 50, ...query } }));
}

// ─── Brand review queue ──────────────────────────────────────────────────

export async function getBrandQueue(query: { status?: string; vendorId?: string; search?: string; page?: number; limit?: number } = {}) {
  const r = await adminRequest<Ok<{ brands: QueueBrand[]; total: number; totalPages: number }>>("/admin/staff-operations/brands-queue", { query: { limit: 20, ...query } });
  return { brands: r.brands || [], total: r.total || 0, totalPages: r.totalPages || 1 };
}

/** Backend compares upper-case APPROVE / REJECT; anything else only stores the reviewer notes. */
export const reviewBrand = (id: string, input: { action: "APPROVE" | "REJECT" | "REQUEST_INFO"; reviewerNotes?: string; rejectionReason?: string }) =>
  adminRequest<Ok<{ brand: QueueBrand }>>(`/admin/staff-operations/brands-queue/${encodeURIComponent(id)}/review`, { method: "PATCH", json: input });

// ─── Vendor sales analytics ──────────────────────────────────────────────

export async function getSalesAnalytics(query: { vendorId?: string; range?: string }): Promise<SalesAnalytics> {
  const r = await adminRequest<Ok<{ data: SalesAnalytics }>>("/admin/staff-operations/sales-analytics", { query });
  return r.data;
}

export async function getProductsAnalytics(query: { vendorId?: string; search?: string; page?: number; limit?: number }) {
  const r = await adminRequest<Ok<{ products: ProductPerformance[]; pagination: { page: number; pages: number; total: number } }>>("/admin/staff-operations/products-analytics", { query: { limit: 10, ...query } });
  return { products: r.products || [], pages: r.pagination?.pages || 1, total: r.pagination?.total || 0 };
}

// ─── Delivery partners & COD ─────────────────────────────────────────────

export async function getRiders(query: { search?: string; availability?: string; status?: string } = {}): Promise<AdminRider[]> {
  const r = await adminRequest<Ok<{ data: AdminRider[] }>>("/admin/delivery-boys", { query });
  return r.data || [];
}

export async function getCodReconciliation(vendorId?: string): Promise<{ summary: CodReconSummary | null; reconciliation: CodReconRow[] }> {
  const r = await adminRequest<Ok<{ summary: CodReconSummary; reconciliation: CodReconRow[] }>>("/admin/staff-operations/delivery-cod-reconciliation", { query: { vendorId } });
  return { summary: r.summary || null, reconciliation: r.reconciliation || [] };
}

/** Backend stores `notes` and `disputedAmount` (it has no separate reason field). */
export const raiseCodDispute = (input: { deliveryBoyId?: string; vendorId?: string; disputedAmount: number; notes: string }) =>
  adminRequest<Ok<{ message: string }>>("/admin/staff-operations/delivery-cod-dispute", { method: "POST", json: input });

export async function getLiveMapData(): Promise<{ vendors: MapVendor[]; riders: MapRider[]; timestamp?: string }> {
  const r = await adminRequest<Ok<{ data: { vendors: MapVendor[]; riders: MapRider[]; timestamp?: string } }>>("/admin/map/live-data");
  return { vendors: r.data?.vendors || [], riders: r.data?.riders || [], timestamp: r.data?.timestamp };
}

// ─── Returns & refund claims (app: Screens/adminScreens/refunds-workflow.tsx) ──
// Field names follow what the backend reads, which differs from what the app sends in several places.

export async function getRefundQueue(query: { refundType?: "vendor" | "my"; status?: string; vendorId?: string; page?: number; limit?: number }) {
  const r = await adminRequest<Ok<{ refunds: RefundClaim[]; summary?: RefundSummary; pagination?: { page: number; pages: number; total: number } }>>(
    "/admin/staff-operations/refunds-queue",
    { query: { limit: 12, ...query, status: query.status === "ALL" ? undefined : query.status } }
  );
  return { refunds: r.refunds || [], summary: r.summary || null, pages: r.pagination?.pages || 1, total: r.pagination?.total || 0 };
}

/** Backend reads `action` (FORWARD_TO_FINANCE | SCHEDULE_PICKUP | REJECT), `notes`, `rejectionReason`. */
export const examineRefund = (id: string, input: { action: "FORWARD_TO_FINANCE" | "SCHEDULE_PICKUP" | "REJECT"; notes?: string; rejectionReason?: string }) =>
  adminRequest<Ok<{ refund?: RefundClaim; data?: RefundClaim }>>(`/admin/staff-operations/refunds/${encodeURIComponent(id)}/examine`, { method: "PATCH", json: input });

/** Super admin or staff assigns a rider; the backend generates customer pickup OTP. */
export const assignRefundPickup = (id: string, input: { deliveryBoyId: string; notes?: string; trackingNumber?: string }) =>
  adminRequest<Ok<{ pickupOtp?: string; refund?: RefundClaim; data?: RefundClaim }>>(`/admin/staff-operations/refunds/${encodeURIComponent(id)}/pickup`, { method: "PATCH", json: input });

/** pickupStatus must be one of the model's pickup enum values (ASSIGNED | OUT_FOR_PICKUP | PICKED_UP | RECEIVED_AT_VENDOR | FAILED). */
export const updateRefundPickup = (id: string, input: { pickupStatus: string; notes?: string; deliveryBoyId?: string; trackingNumber?: string }) =>
  adminRequest<Ok<{ refund?: RefundClaim; data?: RefundClaim; pickupOtp?: string }>>(`/admin/staff-operations/refunds/${encodeURIComponent(id)}/pickup`, { method: "PATCH", json: input });

/** Backend reads `result` (PASSED | FAILED) and `notes`. */
export const recordRefundInspection = (id: string, input: { result: "PASSED" | "FAILED"; notes?: string }) =>
  adminRequest<Ok<{ refund?: RefundClaim; data?: RefundClaim }>>(`/admin/staff-operations/refunds/${encodeURIComponent(id)}/inspection`, { method: "PATCH", json: input });

/** COD / vendor-funded claims: executes the ledger refund. */
export const finalizeRefundPayout = (id: string, input: { notes?: string; payoutReference?: string } = {}) =>
  adminRequest<Ok<{ refund?: RefundClaim; data?: RefundClaim }>>(`/admin/staff-operations/refunds/${encodeURIComponent(id)}/finalize-payout`, { method: "PATCH", json: input });

/** Online claims: super admin records the gateway / bank payout. */
export const processOnlineRefund = (id: string, input: { payoutReference: string; notes?: string; status?: "COMPLETED" | "PROCESSING" }) =>
  adminRequest<Ok<{ refund?: RefundClaim; data?: RefundClaim }>>(`/refunds/${encodeURIComponent(id)}/superadmin-online-payout`, { method: "PATCH", json: { status: "COMPLETED", ...input } });

// ─── Broadcast notifications & operational alerts (app: Screens/adminScreens/notifications.tsx) ──

export interface StaffAlert { _id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; data?: Record<string, unknown> }
export interface NotificationRecipient { id: string; name: string; phone?: string; email?: string; role: string; avatar?: string }
export interface BroadcastHistoryItem {
  _id?: string;
  id?: string;
  title: string;
  body: string;
  targetAudience?: string;
  targetRole?: string;
  recipientName?: string;
  deepLink?: string;
  recipientCount?: number;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  source?: string;
  createdAt: string;
}

/** Backend filters on `isRead` (the app sends `unreadOnly`, which it ignores). */
export async function getStaffAlerts(query: { type?: string; unreadOnly?: boolean; page?: number; limit?: number }) {
  const r = await adminRequest<Ok<{ notifications: StaffAlert[]; total: number; unreadCount: number; totalPages: number }>>("/admin/staff-operations/notifications", {
    query: { page: query.page, limit: query.limit ?? 15, type: query.type && query.type !== "all" ? query.type : undefined, isRead: query.unreadOnly ? "false" : undefined },
  });
  return { notifications: r.notifications || [], total: r.total || 0, unreadCount: r.unreadCount || 0, totalPages: r.totalPages || 1 };
}
export const markStaffAlertRead = (id: string) => adminRequest<Ok<object>>(`/admin/staff-operations/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });

export async function searchRecipients(role: string, q: string): Promise<NotificationRecipient[]> {
  const r = await adminRequest<Ok<{ data: NotificationRecipient[] }>>("/admin/notifications/search-recipients", { query: { role, q } });
  return r.data || [];
}

export const sendBroadcast = (input: { title: string; body: string; targetAudience: string; targetRole?: string; targetId?: string; deepLink?: string; data?: Record<string, unknown> }) =>
  adminRequest<Ok<{ data: { recipientCount?: number } }>>("/admin/notifications/send", { method: "POST", json: input });

export async function getBroadcastHistory(query: { page?: number; limit?: number; search?: string }) {
  const r = await adminRequest<Ok<{ data: { history: BroadcastHistoryItem[]; total: number; page: number; pages: number } }>>("/admin/notifications/history", { query: { limit: 15, ...query } });
  return { history: r.data?.history || [], total: r.data?.total || 0, pages: r.data?.pages || 1 };
}

/**
 * Every store for dropdowns/filters — same endpoint the app's store pickers use
 * (GET /admin/staff-operations/assigned-vendors): all stores for a super admin, no page limit.
 * Returned in the `{ data }` shape of getVendors so pickers can use either.
 */
export async function getStoreOptions(): Promise<{ data: AdminVendor[] }> {
  const r = await adminRequest<Ok<{ vendors: Array<AdminVendor & { storeName?: string }> }>>("/admin/staff-operations/assigned-vendors");
  return {
    data: (r.vendors || []).map((v) => ({ ...v, businessDetails: { ...v.businessDetails, businessName: v.businessDetails?.businessName || v.storeName } })),
  };
}

// ─── Staff Admin console (app: StaffAdminMain/* and Screens/staffadminScreens/*) ──

export interface StaffOverview {
  kpi: {
    totalVendors: number;
    activeVendors: number;
    inactiveVendors: number;
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    totalOrders: number;
    grossSales: number;
    deliveredSales: number;
    codSales: number;
    onlineSales: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  pendingTasks: { pendingRefunds: number; pendingBrands: number; pendingWithdrawals: number; openTickets: number; activeDeliveries: number; totalPendingTasks: number };
  dailyTrends: Array<{ _id: string; sales: number; ordersCount: number }>;
  recentOrders: Array<{ _id: string; orderNumber: string; totalAmount: number; orderStatus: string; paymentMethod?: string; createdAt: string; vendorName?: string }>;
}

/** timeframe: today | yesterday | 7days | 30days | thisMonth */
export async function getStaffOverview(query: { timeframe: string; vendorId?: string }): Promise<StaffOverview> {
  const r = await adminRequest<Ok<{ data: StaffOverview }>>("/admin/staff-operations/dashboard-overview", { query });
  return r.data;
}

/** Stores assigned to the signed-in staff admin, with the backend's computed name / city / state. */
export interface AssignedStore extends AdminVendor {
  storeName?: string;
  city?: string;
  state?: string;
}
export async function getAssignedStores(): Promise<AssignedStore[]> {
  const r = await adminRequest<Ok<{ vendors: AssignedStore[] }>>("/admin/staff-operations/assigned-vendors");
  return r.vendors || [];
}

// Vendor broadcasts (app: staffadminScreens/BroadcastNotificationScreen)
export type BroadcastTarget = "ASSIGNED_VENDORS" | "SPECIFIC_VENDORS" | "ALL_VENDORS";
export interface BroadcastPermissions {
  canBroadcastToAssignedVendors: boolean;
  canBroadcastToSpecificVendors: boolean;
  canBroadcastToAllVendors: boolean;
  isSuperAdmin: boolean;
  hasAnyBroadcastPermission: boolean;
}
export interface BroadcastVendor { _id: string; businessName?: string; sellerName?: string; sellerEmail?: string; sellerPhone?: string; status?: string; isStoreOpen?: boolean }
export interface VendorBroadcast {
  _id: string;
  title: string;
  message: string;
  targetType: BroadcastTarget;
  notificationType?: string;
  imageUrl?: string;
  recipientCount?: number;
  status?: string;
  senderName?: string;
  sender?: { name?: string; email?: string } | null;
  sentAt?: string;
  createdAt: string;
}

export async function getBroadcastPermissions(): Promise<BroadcastPermissions> {
  const r = await adminRequest<Ok<{ data: BroadcastPermissions }>>("/admin/broadcasts/permissions");
  return r.data;
}
export async function getBroadcastEligibleVendors(query: { search?: string; page?: number; limit?: number }) {
  const r = await adminRequest<Ok<{ data: { vendors: BroadcastVendor[]; total: number; pages: number } }>>("/admin/broadcasts/eligible-vendors", { query: { limit: 50, ...query } });
  return { vendors: r.data?.vendors || [], total: r.data?.total || 0 };
}
export async function getBroadcastRecipientPreview(targetType: BroadcastTarget, vendorIds?: string[]): Promise<number> {
  const r = await adminRequest<Ok<{ data: { recipientCount: number } }>>("/admin/broadcasts/recipient-preview", { query: { targetType, vendorIds: vendorIds?.length ? vendorIds.join(",") : undefined } });
  return r.data?.recipientCount ?? 0;
}
export const sendVendorBroadcast = (input: { title: string; message: string; targetType: BroadcastTarget; vendorIds?: string[]; notificationType: string; imageUrl?: string; idempotencyKey: string }) =>
  adminRequest<Ok<{ data: { recipientCount?: number } }>>("/admin/broadcasts/send", { method: "POST", json: input });
export async function getVendorBroadcastHistory(query: { page?: number; targetType?: string; search?: string }) {
  const r = await adminRequest<Ok<{ data: { broadcasts: VendorBroadcast[]; total: number; pages: number } }>>("/admin/broadcasts/history", { query: { limit: 20, ...query } });
  return { broadcasts: r.data?.broadcasts || [], total: r.data?.total || 0, pages: r.data?.pages || 1 };
}


// --- Vendor sales analytics, as the app reads it (res.analytics) ---
// app: adminScreens/vendor-analytics.tsx and VendorAnalyticsDetailsScreen.tsx

export interface VendorAnalytics {
  summary: {
    totalOrders: number;
    orderCount?: number;
    grossSales: number;
    completedOrders: number;
    completedSales?: number;
    netSales: number;
    codSales: number;
    onlineSales: number;
    cancelledOrders: number;
    returnedOrders: number;
    returnRefundRate: number;
  } | null;
  categoryBreakdown: Array<{ category: string; unitsSold: number; revenue: number }>;
  topSellingProducts: Array<{ productId: string; name: string; imageUrl?: string; price?: number; unitsSold: number; revenue: number }>;
  timeline: Array<{ date: string; sales: number; orders: number }>;
  ordersByStatus: Array<{ _id: string; count: number; value?: number }>;
}

/** range: all | today | yesterday | 7d | 30d | monthly */
export async function getVendorAnalytics(query: { vendorId?: string; range: string }): Promise<VendorAnalytics> {
  const r = await adminRequest<Ok<{ analytics?: Partial<VendorAnalytics> }>>("/admin/staff-operations/sales-analytics", { query });
  const a = r.analytics || {};
  return {
    summary: a.summary || null,
    categoryBreakdown: a.categoryBreakdown || [],
    topSellingProducts: a.topSellingProducts || [],
    timeline: a.timeline || [],
    ordersByStatus: a.ordersByStatus || [],
  };
}

// --- Vendor image storage (super admin) ---
// Backend: routes/storageRoutes.js (adminStorageRouter, super admin only)

export interface StorageVendorRow {
  vendorId: string;
  name: string;
  email?: string;
  logo?: string;
  status?: string;
  usedBytes: number;
  quotaBytes: number;
  assetCount: number;
  percent: number;
  updatedAt?: string | null;
}
export interface StorageTotals {
  vendors: number;
  usedBytes: number;
  assets: number;
  nearLimit: number;
  full: number;
  pendingRecharges: number;
  defaultQuotaBytes: number;
}
export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  freeBytes: number;
  percent: number;
  assetCount: number;
  isFull: boolean;
}
export interface StorageAssetRow {
  _id: string;
  url: string;
  bytes: number;
  kind: string;
  status?: string;
  createdAt: string;
  releasedAt?: string | null;
}
export interface StorageRechargeRow {
  _id: string;
  vendor?: string | { _id: string };
  vendorName?: string;
  planId: string;
  planName: string;
  extraBytes: number;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentRef?: string;
  vendorNote?: string;
  status: "PENDING" | "PAID" | "APPROVED" | "REJECTED";
  reviewedBy?: { name?: string; email?: string } | null;
  reviewedAt?: string | null;
  adminNote?: string;
  quotaBefore?: number | null;
  quotaAfter?: number | null;
  createdAt: string;
}
export interface VendorStorageDetail {
  vendor: { vendorId: string; name: string; email?: string; logo?: string; status?: string };
  usage: StorageUsage;
  breakdown: Array<{ kind: string; bytes: number; count: number }>;
  largest: StorageAssetRow[];
  recent: StorageAssetRow[];
  recharges: StorageRechargeRow[];
}

export async function getStorageVendors(query: { search?: string; filter?: "all" | "near" | "full"; page?: number; limit?: number } = {}) {
  const r = await adminRequest<Ok<{ data: { vendors: StorageVendorRow[]; totals: StorageTotals; page: number; pages: number; total: number } }>>("/admin/storage/vendors", { query: { limit: 25, ...query } });
  return r.data;
}
export async function getVendorStorageDetail(vendorId: string): Promise<VendorStorageDetail> {
  const r = await adminRequest<Ok<{ data: VendorStorageDetail }>>(`/admin/storage/vendors/${encodeURIComponent(vendorId)}`);
  return r.data;
}
export const setVendorStorageQuota = (vendorId: string, input: { quotaGb: number; reason?: string }) =>
  adminRequest<Ok<{ data: StorageUsage }>>(`/admin/storage/vendors/${encodeURIComponent(vendorId)}/quota`, { method: "PATCH", json: input });
export async function getStorageRecharges(query: { status?: "PENDING" | "APPROVED" | "REJECTED" | "ALL"; page?: number; limit?: number } = {}) {
  const r = await adminRequest<Ok<{ data: { recharges: StorageRechargeRow[]; page: number; pages: number; total: number } }>>("/admin/storage/recharges", { query: { limit: 25, ...query } });
  return r.data;
}
export const reviewStorageRecharge = (id: string, input: { action: "APPROVE" | "REJECT"; note?: string; paymentVerified?: boolean }) =>
  adminRequest<Ok<{ data: StorageRechargeRow }>>(`/admin/storage/recharges/${encodeURIComponent(id)}`, { method: "PATCH", json: input });
