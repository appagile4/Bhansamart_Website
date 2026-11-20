"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Store,
  UserCog,
  X,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminPermissionKey, AdminPermissions, StaffAdmin } from "@/lib/admin/types";
import { formatDate } from "@/lib/seller/format";
import { storeName } from "@/lib/admin/format";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
  StatCard,
  SuccessBanner,
  Tabs,
  btn,
  field,
  fieldLabel,
} from "@/components/admin/ui";

// Same switches, titles and descriptions as the app's admins.tsx modal
const OPERATIONAL: Array<[AdminPermissionKey, string, string]> = [
  ["canManageVendors", "Manage Vendor Profiles", "View business details, contacts & store open hours"],
  ["canEditProducts", "Product & Stock Moderation", "Approve, reject, or edit products for assigned stores"],
  ["canViewOrders", "Order Fulfillment & Refunds", "Track deliveries, process vendor returns and refunds"],
  ["canManageTickets", "Support & Ticket Resolution", "Respond to customer complaints & vendor support tickets"],
  ["canViewAnalytics", "Scoped Sales & Analytics", "View sales charts, order volume, and revenue metrics"],
];
const BROADCAST: Array<[AdminPermissionKey, string, string]> = [
  ["canBroadcastToAssignedVendors", "Send to Assigned Vendors", "Staff Admin can send notifications only to stores assigned to them"],
  ["canBroadcastToSpecificVendors", "Send to Specific Vendors", "Staff Admin can search and pick one or multiple individual stores"],
  ["canBroadcastToAllVendors", "Send to All Vendors", "Staff Admin can broadcast notifications platform-wide to all eligible vendors"],
];
// Fallbacks for an existing admin's missing flags (app: openEdit "?? true / ?? false")
const DEFAULTS: Partial<AdminPermissions> = {
  canManageVendors: true,
  canEditProducts: true,
  canViewOrders: true,
  canManageTickets: true,
  canSendNotifications: true,
  canViewAnalytics: true,
  canBroadcastToAssignedVendors: false,
  canBroadcastToSpecificVendors: false,
  canBroadcastToAllVendors: false,
};
// A brand-new staff admin (app: DEFAULT_PERMISSIONS — assigned-vendor broadcasting on)
const NEW_DEFAULTS: Partial<AdminPermissions> = { ...DEFAULTS, canBroadcastToAssignedVendors: true };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

export default function StaffAdminsPage() {
  const q = useAsync(() => api.getStaffAdmins(), "admins");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StaffAdmin | "new" | null>(null);
  const [confirming, setConfirming] = useState<{ admin: StaffAdmin; targetActive: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const admins = useMemo(() => q.data || [], [q.data]);
  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return admins.filter((a) => {
      if (filter === "active" && !a.isActive) return false;
      if (filter === "inactive" && a.isActive) return false;
      return !s || [a.name, a.email, a.phone].some((f) => (f || "").toLowerCase().includes(s));
    });
  }, [admins, filter, search]);

  const toggleActive = async (a: StaffAdmin, targetActive: boolean) => {
    setBusyId(a._id);
    setActionError(null);
    try {
      await api.updateStaffAdmin(a._id, { isActive: targetActive });
      setNotice(`${a.name} is now ${targetActive ? "active" : "deactivated"}.`);
      q.reload();
    } catch (e) {
      setActionError(api.errorText(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff Admins"
        subtitle="Create staff admin accounts, assign stores and control what they can do."
        actions={
          <button type="button" onClick={() => setEditing("new")} className={btn.primary}>
            <Plus className="w-4 h-4" /> New Staff Admin
          </button>
        }
      />
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Staff" value={admins.length} icon={UserCog} tone="teal" />
          <StatCard label="Active Staff" value={admins.filter((a) => a.isActive).length} tone="green" />
          <StatCard
            label="Stores Scoped"
            value={admins.reduce((n, a) => n + (a.assignedVendorsCount ?? a.assignedVendors?.length ?? 0), 0)}
            tone="violet"
            icon={Store}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
          <div className="relative sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className={`${field} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or phone…"
              aria-label="Search staff admins"
            />
          </div>
        </div>
        {notice && <SuccessBanner message={notice} />}
        {(q.error || actionError) && (
          <ErrorBanner message={(q.error || actionError)!} onRetry={q.error ? q.reload : undefined} />
        )}

        {q.loading && !q.data ? (
          <LoadingBlock text="Loading staff admins…" />
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80">
            <EmptyState icon={UserCog} title="No staff admins" text="Create one and assign the stores they manage." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {visible.map((a) => {
              const perms = { ...DEFAULTS, ...(a.adminPermissions || {}) };
              const storeCount = a.assignedVendorsCount ?? a.assignedVendors?.length ?? 0;
              const openTickets = a.openTickets ?? 0;

              return (
                <article
                  key={a._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3.5 hover:border-sky-300 transition-all"
                >
                  {/* Card Header matching app */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-base relative shrink-0 ${
                          a.isActive ? "bg-sky-100 text-[#0284C7]" : "bg-red-100 text-red-600"
                        }`}
                      >
                        <span>{a.name?.[0]?.toUpperCase() || "A"}</span>
                        <span
                          className={`w-3 h-3 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                            a.isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{a.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-50 text-[#0284C7] border border-sky-100 uppercase tracking-wider shrink-0">
                            Staff Admin
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{a.email}</p>
                        {a.phone && (
                          <a
                            href={`tel:${a.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#0284C7] mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-[#0284C7]" />
                            <span>{a.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                        a.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${a.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Middle 3-Column Metrics Panel (matches app's styles.statsRow) */}
                  <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-[#F8FAFC] border border-slate-200 py-2.5 px-1 text-center">
                    <div className="px-1">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <Store className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>Scope</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {storeCount} {storeCount === 1 ? "Store" : "Stores"}
                      </p>
                    </div>
                    <div className="px-1">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <Headphones className={`w-3.5 h-3.5 ${openTickets > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                        <span>Queue</span>
                      </div>
                      <p className={`text-sm font-extrabold mt-1 ${openTickets > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {openTickets} Open
                      </p>
                    </div>
                    <div className="px-1">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Registered</span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-1.5">
                        {a.createdAt ? formatDate(a.createdAt) : "Active"}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Stores Tags */}
                  {a.assignedVendors.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Assigned Stores ({a.assignedVendors.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.assignedVendors.slice(0, 4).map((v) => (
                          <span
                            key={v._id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] border border-[#DBEAFE] text-slate-800 text-[11px] font-semibold"
                          >
                            <Store className="w-3 h-3 text-[#0284C7]" />
                            <span className="truncate max-w-[140px]">{v.businessDetails?.businessName || "Store"}</span>
                          </span>
                        ))}
                        {a.assignedVendors.length > 4 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                            +{a.assignedVendors.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Permissions Pills */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Active Permissions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...OPERATIONAL, ...BROADCAST]
                        .filter(([k]) => perms[k])
                        .map(([k, label]) => (
                          <span
                            key={k}
                            className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-[10px] font-bold text-[#0284C7]"
                          >
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditing(a)}
                      className={`${btn.outline} h-9 flex-1`}
                    >
                      <Pencil className="w-4 h-4" /> Edit Scope
                    </button>
                    <button
                      type="button"
                      disabled={busyId === a._id}
                      onClick={() => setConfirming({ admin: a, targetActive: !a.isActive })}
                      className={`${a.isActive ? btn.danger : btn.success} h-9 flex-1`}
                    >
                      <Power className="w-4 h-4" /> {a.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal before activating or deactivating */}
      {confirming && (
        <Modal
          open
          title="Confirm Status Change"
          onClose={() => (busyId ? undefined : setConfirming(null))}
          footer={
            <>
              <button
                type="button"
                disabled={Boolean(busyId)}
                onClick={() => setConfirming(null)}
                className={btn.ghost}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(busyId)}
                onClick={async () => {
                  const target = confirming;
                  await toggleActive(target.admin, target.targetActive);
                  setConfirming(null);
                }}
                className={confirming.targetActive ? btn.success : btn.dangerSolid}
              >
                {busyId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                  </>
                ) : confirming.targetActive ? (
                  "Activate Staff"
                ) : (
                  "Deactivate Staff"
                )}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Are you sure you want to{" "}
              <strong className={confirming.targetActive ? "text-emerald-700" : "text-red-600"}>
                {confirming.targetActive ? "activate" : "deactivate"}
              </strong>{" "}
              <strong>{confirming.admin.name}</strong>?
            </p>
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                confirming.targetActive
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                  : "bg-red-50/70 border-red-200 text-red-700"
              }`}
            >
              {confirming.targetActive
                ? "This staff member will immediately regain access to their assigned store operations, order fulfillment, and support queues."
                : "This staff member will immediately lose access to all store operational dashboards, order management, and customer tickets."}
            </div>
          </div>
        </Modal>
      )}

      {editing && (
        <AdminEditor
          key={editing === "new" ? "new" : editing._id}
          admin={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setEditing(null);
            setNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

type FieldKey = "name" | "email" | "phone" | "password";
type FieldErrors = Partial<Record<FieldKey, string>>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same rules and messages as the app's admins.tsx validateForm (the backend enforces the same). */
function validate(v: { name: string; email: string; phone: string; password: string }, isNew: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!v.name.trim()) e.name = "Staff member name is required.";
  else if (v.name.trim().length < 2) e.name = "Name must be at least 2 characters long.";
  if (isNew) {
    if (!v.email.trim()) e.email = "Email address is required.";
    else if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address (e.g., admin@bhansamart.com).";
    if (!v.password) e.password = "Initial password is required.";
    else if (v.password.length < 6) e.password = "Password must be at least 6 characters long.";
  } else if (v.password && v.password.length < 6) {
    e.password = "New password must be at least 6 characters long.";
  }
  const phone = v.phone.trim();
  if (!phone) e.phone = "Phone number is required.";
  else if (/[^0-9]/.test(phone)) e.phone = "Invalid phone number. Digits only, no symbols (+, -, etc.) or letters.";
  else if (phone.length !== 10) e.phone = `Phone number must be exactly 10 digits (currently ${phone.length} digits).`;
  return e;
}

/** Point a backend message at the field it is about, so it also shows under that input. */
const fieldForServerError = (msg: string): FieldKey | null => {
  const m = msg.toLowerCase();
  if (m.includes("email")) return "email";
  if (m.includes("phone") || m.includes("mobile")) return "phone";
  if (m.includes("password")) return "password";
  if (m.includes("name")) return "name";
  return null;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1 flex items-start gap-1 text-[11px] font-medium text-red-600">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {message}
    </span>
  );
}

function AdminEditor({
  admin,
  onClose,
  onSaved,
}: {
  admin: StaffAdmin | null;
  onClose: () => void;
  onSaved: (m: string) => void;
}) {
  const isNew = !admin;
  const vendorsQ = useAsync(() => api.getStoreOptions(), "all-vendors");
  const [name, setName] = useState(admin?.name || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [phone, setPhone] = useState(admin?.phone || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stores, setStores] = useState<string[]>(admin?.assignedVendors.map((v) => v._id) || []);
  const [perms, setPerms] = useState<Partial<AdminPermissions>>(
    isNew ? { ...NEW_DEFAULTS } : { ...DEFAULTS, ...(admin?.adminPermissions || {}) }
  );
  const [storeSearch, setStoreSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; field: FieldKey | null } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Live validation once the user has tried to save
  const fieldErrors = useMemo<FieldErrors>(() => {
    const e = submitted ? validate({ name, email, phone, password }, isNew) : {};
    if (serverError?.field && !e[serverError.field]) e[serverError.field] = serverError.message;
    return e;
  }, [submitted, name, email, phone, password, isNew, serverError]);
  const problems = Object.values(fieldErrors).filter(Boolean) as string[];
  const summary = serverError && !serverError.field ? [serverError.message, ...problems] : problems;

  const allStores = useMemo(() => vendorsQ.data?.data || [], [vendorsQ.data]);
  const nameOf = (id: string) => {
    const v = allStores.find((x) => x._id === id);
    if (v) return storeName(v);
    return admin?.assignedVendors.find((x) => x._id === id)?.businessDetails?.businessName || "Store";
  };
  const vendorList = allStores.filter(
    (v) => !storeSearch.trim() || storeName(v).toLowerCase().includes(storeSearch.trim().toLowerCase())
  );

  const handleSelectAll = () => {
    const targetIds = storeSearch.trim()
      ? vendorList.map((v) => v._id)
      : allStores.map((v) => v._id);
    setStores((prev) => Array.from(new Set([...prev, ...targetIds])));
  };

  const handleClearAll = () => {
    setStores([]);
  };

  const clearServerError = (f: FieldKey) => {
    if (serverError?.field === f) setServerError(null);
  };
  const scrollToTop = () =>
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  const save = async () => {
    setSubmitted(true);
    setServerError(null);
    if (Object.keys(validate({ name, email, phone, password }, isNew)).length) {
      scrollToTop();
      return;
    }
    setBusy(true);
    try {
      const adminPermissions = { ...perms, canSendNotifications: perms.canSendNotifications ?? true };
      if (isNew) {
        const r = await api.createStaffAdmin({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          assignedVendors: stores,
          adminPermissions,
        });
        onSaved(r.message || `Staff admin account created for ${name.trim()}.`);
      } else {
        const r = await api.updateStaffAdmin(admin!._id, {
          name: name.trim(),
          phone: phone.trim(),
          assignedVendors: stores,
          adminPermissions,
          ...(password ? { newPassword: password } : {}),
        });
        onSaved(r.message || `Staff permissions updated for ${name.trim()}.`);
      }
    } catch (e) {
      const message = api.errorText(e, "Could not save staff admin account.");
      setServerError({ message, field: fieldForServerError(message) });
      scrollToTop();
    } finally {
      setBusy(false);
    }
  };

  const inputCls = (f: FieldKey) =>
    fieldErrors[f]
      ? field
          .replace("border-slate-200", "border-red-400")
          .replace("focus:border-[#0284C7]", "focus:border-red-500")
          .replace("focus:ring-sky-100", "focus:ring-red-100")
      : field;

  return (
    <Modal
      open
      wide
      title={isNew ? "Create Staff Admin" : `Edit ${admin!.name}`}
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={save} className={btn.primary}>
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : isNew ? (
              "Create Admin"
            ) : (
              "Save Changes"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5" ref={topRef}>
        {summary.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
            <p className="flex items-center gap-2 text-sm font-bold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError ? (isNew ? "Couldn't create this staff admin" : "Couldn't save changes") : "Please fix the following"}
            </p>
            <ul className="mt-1.5 ml-6 list-disc space-y-0.5 text-xs text-red-700">
              {summary.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Account details */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={fieldLabel}>Full name *</span>
            <input
              className={inputCls("name")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearServerError("name");
              }}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "err-name" : undefined}
              placeholder="e.g. Ram Bahadur"
            />
            <FieldError id="err-name" message={fieldErrors.name} />
          </label>
          <label className="block">
            <span className={fieldLabel}>
              Email {isNew ? "*" : <span className="font-normal text-slate-400">(can&apos;t be changed)</span>}
            </span>
            <input
              className={inputCls("email")}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearServerError("email");
              }}
              disabled={!isNew}
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "err-email" : undefined}
              placeholder="staff@bhansamart.com"
            />
            <FieldError id="err-email" message={fieldErrors.email} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Phone *</span>
            <span className="relative block">
              <input
                className={`${inputCls("phone")} pr-14`}
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  clearServerError("phone");
                }}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "err-phone" : "hint-phone"}
                placeholder="9801234567"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold ${
                  phone.length === 10 ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {phone.length}/10
              </span>
            </span>
            {fieldErrors.phone ? (
              <FieldError id="err-phone" message={fieldErrors.phone} />
            ) : (
              <span id="hint-phone" className="mt-1 block text-[11px] text-slate-500">
                Enter a valid 10-digit mobile number (e.g., 9801234567).
              </span>
            )}
          </label>
          <label className="block">
            <span className={fieldLabel}>{isNew ? "Password *" : "New password (optional)"}</span>
            <span className="relative block">
              <input
                className={`${inputCls("password")} pr-10`}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearServerError("password");
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "err-password" : undefined}
                placeholder={isNew ? "Min. 6 characters" : "Leave blank to keep current"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
            <FieldError id="err-password" message={fieldErrors.password} />
          </label>
        </section>

        {/* Assigned stores with Select All / Clear All */}
        <section className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 border-b border-slate-200 bg-slate-50/70">
            <div>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#0284C7]" />
                <span>Assigned Stores</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-sky-100 text-[#0284C7]">
                  {stores.length}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Staff can only access orders, tickets, and products from assigned stores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  className={`${field} h-8 pl-8 text-xs`}
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Filter stores…"
                  aria-label="Filter stores"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-sky-200 bg-sky-50 text-[#0284C7] hover:bg-sky-100 transition-colors cursor-pointer shrink-0"
                title="Select all stores"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                title="Clear all selections"
              >
                Clear All
              </button>
            </div>
          </div>

          {stores.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5 border-b border-slate-200 bg-[#F8FAFC]">
              {stores.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-md bg-[#EFF6FF] border border-[#DBEAFE] text-[11px] font-semibold text-slate-800"
                >
                  <Store className="w-3 h-3 text-[#0284C7]" />
                  <span className="truncate max-w-[160px]">{nameOf(id)}</span>
                  <button
                    type="button"
                    onClick={() => setStores((s) => s.filter((x) => x !== id))}
                    className="p-0.5 rounded-full hover:bg-sky-200 text-sky-700 cursor-pointer"
                    aria-label={`Remove ${nameOf(id)}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleClearAll}
                className="ml-auto text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Clear all ({stores.length})
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-slate-200 bg-amber-50 text-[11px] font-medium text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> No stores selected — this staff admin won&apos;t see any
              store data until you assign at least one.
            </p>
          )}

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {vendorsQ.error ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-red-50" role="alert">
                <p className="flex items-start gap-1.5 text-xs font-medium text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Couldn&apos;t load stores: {vendorsQ.error}
                </p>
                <button type="button" onClick={vendorsQ.reload} className={`${btn.outline} h-8 text-xs shrink-0`}>
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            ) : vendorsQ.loading && !vendorsQ.data ? (
              <p className="flex items-center gap-2 p-3 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#0284C7]" /> Loading stores…
              </p>
            ) : vendorList.length === 0 ? (
              <p className="p-3 text-xs text-slate-500">
                {storeSearch.trim() ? `No stores match "${storeSearch.trim()}".` : "No stores exist yet."}
              </p>
            ) : (
              vendorList.map((v) => {
                const on = stores.includes(v._id);
                return (
                  <label
                    key={v._id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                      on ? "bg-sky-50/70 text-slate-900 font-medium" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setStores((s) => (on ? s.filter((x) => x !== v._id) : [...s, v._id]))}
                      className="w-4 h-4 rounded accent-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="flex-1 truncate">{storeName(v)}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {v.sellerDetails?.city || v.shippingLocations?.city || ""}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </section>

        {/* Permissions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
            <p className="text-sm font-bold text-slate-800">Operational permissions</p>
            <p className="text-[11px] text-slate-500 mb-2">
              Fine-tune functional access within the staff member&apos;s scoped vendors.
            </p>
            <div className="divide-y divide-slate-100">
              {OPERATIONAL.map(([k, l, d]) => (
                <PermissionSwitch
                  key={k}
                  on={Boolean(perms[k])}
                  label={l}
                  desc={d}
                  onToggle={() => setPerms((p) => ({ ...p, [k]: !p[k] }))}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
            <p className="text-sm font-bold text-slate-800">Vendor broadcast targeting</p>
            <p className="text-[11px] text-slate-500 mb-2">
              Super Admin controlled options determining how this Staff Admin can broadcast to stores.
            </p>
            <div className="divide-y divide-slate-100">
              {BROADCAST.map(([k, l, d]) => (
                <PermissionSwitch
                  key={k}
                  on={Boolean(perms[k])}
                  label={l}
                  desc={d}
                  onToggle={() => setPerms((p) => ({ ...p, [k]: !p[k] }))}
                />
              ))}
            </div>
          </div>
        </section>
        <p className="text-[11px] text-slate-500">
          Financial operations (payouts, ledger, bank configuration, audit logs) always stay super-admin only.
        </p>
      </div>
    </Modal>
  );
}

function PermissionSwitch({
  on,
  label,
  desc,
  onToggle,
}: {
  on: boolean;
  label: string;
  desc: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 w-full py-2.5 text-left cursor-pointer hover:bg-slate-50/60 px-1.5 rounded-lg transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5">{desc}</span>
      </span>
      <span
        className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${
          on ? "bg-[#0284C7]" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
