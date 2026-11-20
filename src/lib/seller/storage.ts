"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getMyStorage, getVendorToken, STORAGE_CHANGED_EVENT, type StorageUsageInfo } from "./api";

/**
 * One shared copy of the vendor's image-storage usage for the whole Seller Hub
 * (sidebar meter, warning banner, Storage page). Refreshes when:
 *   • an upload / product delete / QR change finishes (STORAGE_CHANGED_EVENT from lib/seller/api.ts)
 *   • a storage notification arrives over the socket (refreshStorage() from VendorRealtime)
 *   • the tab regains focus
 */
interface StorageState {
  data: StorageUsageInfo | null;
  error: string | null;
  loading: boolean;
}

let state: StorageState = { data: null, error: null, loading: false };
let inflight: Promise<void> | null = null;
let lastFetch = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<StorageState>) => {
  state = { ...state, ...patch };
  emit();
};

export function refreshStorage(force = true): Promise<void> {
  if (typeof window === "undefined" || !getVendorToken()) return Promise.resolve();
  if (inflight) return inflight;
  if (!force && Date.now() - lastFetch < 15_000) return Promise.resolve();
  set({ loading: true });
  inflight = getMyStorage()
    .then((data) => set({ data, error: null, loading: false }))
    .catch((e: unknown) => set({ error: e instanceof Error ? e.message : "Could not load storage usage", loading: false }))
    .finally(() => {
      inflight = null;
      lastFetch = Date.now();
    });
  return inflight;
}

export function clearStorageState() {
  state = { data: null, error: null, loading: false };
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER: StorageState = { data: null, error: null, loading: false };

/** Live storage usage. Mount anywhere inside the Seller Hub. */
export function useStorageUsage() {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER);
  useEffect(() => {
    refreshStorage(false);
    const onChange = () => refreshStorage(true);
    const onFocus = () => refreshStorage(false);
    window.addEventListener(STORAGE_CHANGED_EVENT, onChange);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(STORAGE_CHANGED_EVENT, onChange);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return { ...snap, reload: () => refreshStorage(true) };
}

// ─── Formatting ────────────────────────────────────────────────────────────
export const GB = 1024 ** 3;
export function formatStorage(n = 0) {
  if (n >= GB) return `${(n / GB).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(n / 1024))} KB`;
}
/** 0 (fine), 80, 90 or 100 */
export const storageLevel = (percent = 0) => (percent >= 100 ? 100 : percent >= 90 ? 90 : percent >= 80 ? 80 : 0);
export const storageBarColor = (percent = 0) =>
  percent >= 100 ? "bg-red-500" : percent >= 90 ? "bg-orange-500" : percent >= 80 ? "bg-amber-400" : "bg-vendor";
export const STORAGE_KIND_LABEL: Record<string, string> = {
  product: "Product photos",
  logo: "Store logo",
  qr: "Payment QR",
  brand: "Brand logos",
  other: "Other",
};
