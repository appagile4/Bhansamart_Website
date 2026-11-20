"use client";

import { usePathname } from "next/navigation";

/**
 * Pages under /admin/dashboard are shared with the Staff Admin console (/staff_admin/dashboard).
 * The URL decides which console a page belongs to: its links, which actions it shows,
 * and which session token the API client sends.
 */
export const SUPER_BASE = "/admin/dashboard";
export const STAFF_BASE = "/staff_admin/dashboard";

export const isStaffConsolePath = (pathname: string | null | undefined) => !!pathname && pathname.startsWith("/staff_admin");

/** True when the current browser URL is in the Staff Admin console (safe outside React). */
export const inStaffConsole = () => typeof window !== "undefined" && isStaffConsolePath(window.location.pathname);

export function useConsole() {
  const pathname = usePathname();
  const staff = isStaffConsolePath(pathname);
  return { staff, base: staff ? STAFF_BASE : SUPER_BASE, loginHref: staff ? "/staff_admin/login" : "/admin/login" };
}
