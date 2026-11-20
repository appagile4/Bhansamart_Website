"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, HardDrive, X } from "lucide-react";
import { formatStorage, storageBarColor, storageLevel, useStorageUsage } from "@/lib/seller/storage";

export const STORAGE_HREF = "/seller/dashboard/storage";

/** `neutral` = share-of-usage bars (by type) that should not turn red/amber */
export function StorageBar({ used, quota, className = "h-2", neutral = false }: { used: number; quota: number; className?: string; neutral?: boolean }) {
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 100;
  return (
    <div className={`rounded-full bg-slate-100 overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Image storage used">
      <div className={`h-full rounded-full transition-all ${neutral ? "bg-vendor-accent" : storageBarColor(pct)}`} style={{ width: `${Math.max(pct, used > 0 ? 1 : 0)}%` }} />
    </div>
  );
}

/** Compact meter for the sidebar footer */
export function SidebarStorageMeter({ showLabels, onNavigate }: { showLabels: boolean; onNavigate?: () => void }) {
  const { data } = useStorageUsage();
  if (!data) return null;
  const level = storageLevel(data.percent);
  if (!showLabels) {
    return (
      <Link href={STORAGE_HREF} onClick={onNavigate} title={`Image storage: ${data.percent}% used`} className="mx-auto mb-2 flex w-10 h-10 rounded-xl items-center justify-center hover:bg-slate-50 relative">
        <HardDrive className={`w-5 h-5 ${level ? "text-orange-500" : "text-slate-500"}`} />
        {level > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />}
      </Link>
    );
  }
  return (
    <Link href={STORAGE_HREF} onClick={onNavigate} className="block mx-1 mb-2 p-3 rounded-xl border border-slate-100 hover:border-vendor-100 hover:bg-vendor-soft/40 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-600 inline-flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" /> Storage
        </span>
        <span className={`text-[11px] font-bold ${level >= 100 ? "text-red-600" : level ? "text-orange-600" : "text-slate-500"}`}>{level >= 100 ? "Full" : `${data.percent}%`}</span>
      </div>
      <StorageBar used={data.usedBytes} quota={data.quotaBytes} className="h-1.5" />
      <p className="text-[10px] text-slate-500 mt-1">
        {formatStorage(data.usedBytes)} of {formatStorage(data.quotaBytes)}
      </p>
    </Link>
  );
}

const dismissKey = (level: number) => `bhansa_storage_alert_dismissed_${level}`;
const readDismissed = (level: number) => {
  try {
    return sessionStorage.getItem(dismissKey(level)) === "1";
  } catch {
    return false;
  }
};

/** Warning banner across the Seller Hub at 80 / 90 / 100 % (hidden on the Storage page itself). */
export function StorageAlertBanner() {
  const pathname = usePathname();
  const { data } = useStorageUsage();
  const [dismissedNow, setDismissedNow] = useState<number | null>(null);
  if (!data || pathname === STORAGE_HREF) return null;
  const level = storageLevel(data.percent);
  if (!level) return null;
  // Full storage is never hidden; 80/90 can be dismissed for this browser session
  if (level < 100 && (dismissedNow === level || readDismissed(level))) return null;
  if (data.pendingRecharge && level < 100) return null;

  const full = level >= 100;
  const tone = full ? "bg-red-50 border-red-200 text-red-800" : level >= 90 ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-amber-50 border-amber-200 text-amber-800";
  const dismiss = () => {
    try {
      sessionStorage.setItem(dismissKey(level), "1");
    } catch {
      /* ignore */
    }
    setDismissedNow(level);
  };

  return (
    <div className={`mb-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 text-sm ${tone}`} role="alert">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-extrabold">{full ? "Image storage full" : `Image storage ${data.percent}% used`}</p>
        <p className="text-xs mt-0.5">
          {formatStorage(data.usedBytes)} of {formatStorage(data.quotaBytes)} used.{" "}
          {full
            ? data.pendingRecharge
              ? "Your recharge request is waiting for verification. New image uploads are blocked until it is approved."
              : "New product photos, logos and QR images can't be uploaded until you recharge storage or remove images."
            : "Recharge soon to keep uploading product photos."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={STORAGE_HREF} className="h-9 px-4 rounded-lg bg-vendor-dark hover:bg-vendor-mid text-white text-xs font-bold inline-flex items-center">
          {data.pendingRecharge ? "View request" : "Recharge storage"}
        </Link>
        {!full && (
          <button type="button" onClick={dismiss} className="p-1.5 rounded-lg hover:bg-black/5 cursor-pointer" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Shown under an upload error when the failure was the storage quota. */
export function StorageFullHint({ error }: { error?: string | null }) {
  if (!error || !/image storage/i.test(error)) return null;
  return (
    <div className="p-3 rounded-xl bg-vendor-soft border border-vendor-100 flex items-center justify-between gap-3 text-xs text-vendor-dark">
      <span className="inline-flex items-center gap-2 font-semibold">
        <HardDrive className="w-4 h-4" /> Free up space by removing photos you no longer need, or add more storage.
      </span>
      <Link href={STORAGE_HREF} className="shrink-0 h-8 px-3 rounded-lg bg-vendor-dark text-white font-bold inline-flex items-center">Recharge storage</Link>
    </div>
  );
}
