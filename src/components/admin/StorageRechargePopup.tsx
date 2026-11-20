"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { getStorageRecharges, type StorageRechargeRow } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";

/**
 * Super admin popup: "a vendor has paid for storage — verify it".
 * Polls the pending storage-recharge queue (no admin socket on the website yet) and pops up for
 * requests this browser has not shown before. Approving still happens on the Vendor Storage page,
 * behind an explicit "payment received" confirmation.
 */
const POLL_MS = 20_000;
const SEEN_KEY = "bhansa_admin_seen_storage_recharges";
export const ADMIN_STORAGE_CHANGED_EVENT = "bhansa:admin-storage-changed";

const readSeen = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const writeSeen = (ids: string[]) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-300)));
  } catch {
    /* storage unavailable */
  }
};

const chime = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [660, 990].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.start(t);
      o.stop(t + 0.15);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* audio blocked until the page was interacted with */
  }
};

const gb = (n: number) => `${(n / 1024 ** 3).toFixed(n % 1024 ** 3 === 0 ? 0 : 2)} GB`;

export default function StorageRechargePopup() {
  const router = useRouter();
  const session = useAdminSession();
  const [fresh, setFresh] = useState<StorageRechargeRow[]>([]);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await getStorageRecharges({ status: "PENDING", limit: 20 });
      const seen = new Set(readSeen());
      const unseen = r.recharges.filter((x) => !seen.has(x._id));
      if (unseen.length) {
        setFresh((prev) => {
          const ids = new Set(prev.map((p) => p._id));
          return [...unseen.filter((u) => !ids.has(u._id)), ...prev];
        });
        chime();
        window.dispatchEvent(new Event(ADMIN_STORAGE_CHANGED_EVENT));
      }
      // Drop popups for requests someone already reviewed
      const pendingIds = new Set(r.recharges.map((x) => x._id));
      setFresh((prev) => prev.filter((p) => pendingIds.has(p._id)));
    } catch {
      /* offline / signed out — try again next tick */
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!session?.token || session.user?.role !== "superadmin") return;
    const first = setTimeout(check, 0);
    const id = setInterval(check, POLL_MS);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, [session?.token, session?.user?.role, check]);

  if (!fresh.length) return null;
  const first = fresh[0];

  const markSeen = () => {
    writeSeen([...readSeen(), ...fresh.map((f) => f._id)]);
    setFresh([]);
  };
  const review = () => {
    markSeen();
    router.push("/admin/dashboard/storage?tab=recharges");
    window.dispatchEvent(new Event("bhansa:open-storage-recharges"));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="storage-pay-title">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <span className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0 animate-pulse">
            <BellRing className="w-6 h-6 text-amber-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold tracking-wider text-amber-600">STORAGE PAYMENT RECEIVED</p>
            <p id="storage-pay-title" className="text-base font-extrabold text-slate-900">
              {fresh.length > 1 ? `${fresh.length} new payments to verify` : "New payment to verify"}
            </p>
          </div>
          <button type="button" onClick={markSeen} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
            <Row label="Vendor" value={first.vendorName || "Store"} />
            <Row label="Plan" value={`${first.planName} (+${gb(first.extraBytes)})`} />
            <Row label="Amount" value={`${first.currency} ${first.amount.toLocaleString()}`} strong />
            <Row label="Payment ref" value={first.paymentRef || "not given"} />
            {first.vendorNote && <Row label="Note" value={first.vendorNote} />}
          </div>
          {fresh.length > 1 && <p className="text-xs text-slate-500">+{fresh.length - 1} more waiting in Recharge Requests.</p>}
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            No payment gateway is connected. Check this amount actually reached BhansaMart&apos;s account before approving. Storage is only added when you approve.
          </p>
        </div>
        <div className="px-5 pb-5 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={markSeen} className="h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer hover:bg-slate-200">
            Later
          </button>
          <button type="button" onClick={review} className="h-11 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold cursor-pointer">
            Review payment
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right break-words ${strong ? "font-extrabold text-[#0284C7]" : "font-semibold text-slate-900"}`}>{value}</span>
    </div>
  );
}
