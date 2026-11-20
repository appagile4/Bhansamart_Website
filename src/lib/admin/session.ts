"use client";

import { useSyncExternalStore } from "react";

/**
 * Admin console sessions. The Super Admin (/admin) and Staff Admin (/staff_admin) consoles each keep
 * their own token, separate from the customer (`bhansa_token`) and seller (`bhansa_vendor_token`)
 * sessions, so all of them can coexist in one browser.
 * Super admin uses the same storage key the app uses for admins (`bhansa_admin_token`).
 */
export interface AdminPermissionFlags {
  canManageVendors?: boolean;
  canEditProducts?: boolean;
  canManageTickets?: boolean;
  canViewOrders?: boolean;
  canSendNotifications?: boolean;
  canViewAnalytics?: boolean;
  canReviewWithdrawals?: boolean;
  canReviewBrands?: boolean;
  canExamineRefunds?: boolean;
  canReconcileCod?: boolean;
  canTrackDeliveries?: boolean;
  canBroadcastToAssignedVendors?: boolean;
  canBroadcastToSpecificVendors?: boolean;
  canBroadcastToAllVendors?: boolean;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  adminPermissions?: AdminPermissionFlags;
  assignedVendors?: unknown[];
}

export interface AdminSession {
  token: string;
  user: AdminUser | null;
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

function createSessionStore(tokenKey: string, userKey: string, event: string) {
  const getToken = () => (typeof window === "undefined" ? null : read(tokenKey));

  const save = (token: string, user: AdminUser) => {
    try {
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(event));
  };

  const clear = () => {
    try {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(event));
  };

  // useSyncExternalStore needs a stable snapshot: cache by the raw strings
  let lastRaw = "";
  let lastSession: AdminSession | null = null;
  const snapshot = (): AdminSession | null => {
    const token = read(tokenKey);
    const userRaw = read(userKey) || "";
    const raw = `${token}|${userRaw}`;
    if (raw === lastRaw) return lastSession;
    lastRaw = raw;
    let user: AdminUser | null = null;
    try {
      user = userRaw ? (JSON.parse(userRaw) as AdminUser) : null;
    } catch {
      user = null;
    }
    lastSession = token ? { token, user } : null;
    return lastSession;
  };

  const subscribe = (cb: () => void) => {
    window.addEventListener(event, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(event, cb);
      window.removeEventListener("storage", cb);
    };
  };

  /**
   * `undefined` on the server and during hydration (unknown), then the session or `null`.
   * Hydration-safe: the first client render matches the server HTML.
   */
  const useSession = (): AdminSession | null | undefined => useSyncExternalStore(subscribe, snapshot, () => undefined);

  return { getToken, save, clear, useSession };
}

const superAdmin = createSessionStore("bhansa_admin_token", "bhansa_admin_user", "bhansa-admin-session");
const staffAdmin = createSessionStore("bhansa_staff_admin_token", "bhansa_staff_admin_user", "bhansa-staff-admin-session");

// Super Admin console (/admin)
export const getAdminToken = superAdmin.getToken;
export const saveAdminSession = superAdmin.save;
export const clearAdminSession = superAdmin.clear;
export const useAdminSession = superAdmin.useSession;

// Staff Admin console (/staff_admin)
export const getStaffAdminToken = staffAdmin.getToken;
export const saveStaffAdminSession = staffAdmin.save;
export const clearStaffAdminSession = staffAdmin.clear;
export const useStaffAdminSession = staffAdmin.useSession;
