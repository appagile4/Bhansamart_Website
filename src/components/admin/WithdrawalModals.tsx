"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Landmark,
  PlusCircle,
  Search,
  Store,
  X,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import type { AdminWithdrawal, AdminVendor } from "@/lib/admin/types";
import { npr } from "@/lib/seller/format";
import { Modal, btn, field, fieldLabel } from "./ui";

/** Super admin payout dialogs (app: vendorDetails.tsx / finance.tsx decision & create modals) */
export function ReviewWithdrawalModal({
  w,
  action,
  onClose,
  onDone,
}: {
  w: AdminWithdrawal;
  action: "APPROVE" | "REJECT";
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (action === "APPROVE" && !ref.trim()) return setError("Enter the bank / UTR payout reference.");
    if (action === "REJECT" && !reason.trim()) return setError("Enter a reason for declining.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.reviewWithdrawal(w._id, {
        action,
        payoutReference: ref.trim() || undefined,
        reason: reason.trim() || undefined,
      });
      onDone(r.message || (action === "APPROVE" ? "Payout approved." : "Payout declined."));
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={action === "APPROVE" ? "Approve payout" : "Decline payout"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className={action === "APPROVE" ? btn.success : btn.danger}
          >
            {busy ? "Saving…" : action === "APPROVE" ? "Mark as Paid" : "Decline"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Amount <span className="font-extrabold text-slate-900">{npr(Math.abs(w.amount))}</span>
        </p>
        {action === "APPROVE" ? (
          <label className="block">
            <span className={fieldLabel}>Payout reference / UTR *</span>
            <input
              className={field}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Bank transfer reference"
            />
          </label>
        ) : (
          <label className="block">
            <span className={fieldLabel}>Reason *</span>
            <textarea
              className={`${field} h-24 py-2`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        )}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}

export function CreateWithdrawalModal({
  vendorId: initialVendorId,
  vendorName: initialVendorName,
  available: initialAvailable,
  onClose,
  onDone,
}: {
  vendorId?: string;
  vendorName?: string;
  available?: number;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Partial<AdminVendor> | null>(() => {
    if (initialVendorId) {
      return {
        _id: initialVendorId,
        businessDetails: { businessName: initialVendorName || "Store" },
        wallet: {
          currentBalance: initialAvailable ?? 0,
          totalEarned: 0,
          pendingSettlement: 0,
          codCashWithDeliveryBoys: 0,
          pendingRecoveries: 0,
        },
      };
    }
    return null;
  });

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors list if not pre-provided or to allow switching
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingVendors(true);
      try {
        const res = await api.getVendors({ limit: 100 });
        if (!cancelled && res.data) {
          setVendors(res.data);
          // If we had an initial vendorId, find full details from list
          if (initialVendorId) {
            const found = res.data.find((v) => v._id === initialVendorId);
            if (found) setSelectedVendor(found);
          }
        }
      } catch (err) {
        console.warn("Could not fetch vendors for withdrawal selector:", err);
      } finally {
        if (!cancelled) setLoadingVendors(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [initialVendorId]);

  const filteredVendors = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const bName = (v.businessDetails?.businessName || "").toLowerCase();
      const sName = (v.sellerDetails?.sellerName || "").toLowerCase();
      const phone = (v.sellerDetails?.sellerPhone || v.businessDetails?.businessPhone || "").toLowerCase();
      return bName.includes(q) || sName.includes(q) || phone.includes(q);
    });
  }, [vendors, search]);

  const currentAvailable = selectedVendor?.wallet?.currentBalance ?? initialAvailable ?? 0;
  const numAmount = parseFloat(amount) || 0;
  const exceedsBalance = selectedVendor ? numAmount > currentAvailable : false;

  const setPercent = (pct: number) => {
    if (currentAvailable <= 0) return;
    const calculated = Math.round(currentAvailable * pct * 100) / 100;
    setAmount(String(calculated));
    setError(null);
  };

  const submit = async () => {
    if (!selectedVendor?._id) {
      return setError("Please select a store / vendor first.");
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return setError("Enter a valid withdrawal amount.");
    }
    if (amt > currentAvailable) {
      return setError(`Withdrawal amount (${npr(amt)}) exceeds vendor available balance (${npr(currentAvailable)}).`);
    }

    setBusy(true);
    setError(null);
    try {
      const r = await api.createVendorWithdrawal({
        vendorId: selectedVendor._id,
        amount: amt,
        notes: notes.trim() || undefined,
      });
      onDone(r.message || "Withdrawal request created successfully.");
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const vendorStoreName =
    selectedVendor?.businessDetails?.businessName ||
    selectedVendor?.sellerDetails?.sellerName ||
    "Store";

  return (
    <Modal
      open
      wide
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">Create Vendor Withdrawal</h2>
            <p className="text-xs text-slate-500 font-normal">Create and queue an official payout request from vendor wallet.</p>
          </div>
        </div>
      }
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            {selectedVendor ? (
              <span>
                Available: <span className="font-bold text-emerald-700">{npr(currentAvailable)}</span>
              </span>
            ) : (
              <span>Select a store to continue</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !selectedVendor || numAmount <= 0 || exceedsBalance}
              onClick={submit}
              className={`${btn.primary} bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50`}
            >
              {busy ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step 1: Vendor Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={fieldLabel}>Select Store / Vendor *</span>
            {selectedVendor && (
              <button
                type="button"
                onClick={() => {
                  setSelectedVendor(null);
                  setAmount("");
                  setError(null);
                }}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Change Store
              </button>
            )}
          </div>

          {selectedVendor ? (
            /* Selected Vendor Card */
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm truncate">{vendorStoreName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        Verified Store
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedVendor.sellerDetails?.sellerName && `${selectedVendor.sellerDetails.sellerName} · `}
                      {selectedVendor.sellerDetails?.sellerPhone || selectedVendor.businessDetails?.businessPhone || ""}
                    </p>
                    {selectedVendor.bankDetails?.bankName && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {selectedVendor.bankDetails.bankName}
                          {selectedVendor.bankDetails.accountNumber && (
                            <> · A/C: ••••{selectedVendor.bankDetails.accountNumber.slice(-4)}</>
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 bg-white/80 sm:bg-transparent rounded-lg p-2.5 sm:p-0 border border-emerald-100 sm:border-0">
                  <span className="text-[11px] font-medium text-slate-500 block">Available Balance</span>
                  <span className="text-base font-black text-emerald-700 block">{npr(currentAvailable)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Vendor Picker with Search */
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className={`${field} pl-9 pr-8 text-sm h-10`}
                  placeholder="Search store name, owner, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto divide-y divide-slate-100 shadow-inner">
                {loadingVendors && !vendors.length ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading vendors and balances…</div>
                ) : filteredVendors.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No vendors found matching &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filteredVendors.map((v) => {
                    const balance = v.wallet?.currentBalance ?? 0;
                    const name = v.businessDetails?.businessName || v.sellerDetails?.sellerName || "Store";
                    return (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => {
                          setSelectedVendor(v);
                          setSearch("");
                          setError(null);
                        }}
                        className="w-full text-left p-3 hover:bg-sky-50/50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold text-xs group-hover:bg-sky-200 transition-colors">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-sm block truncate group-hover:text-sky-700">
                              {name}
                            </span>
                            <span className="text-xs text-slate-500 truncate block">
                              {v.sellerDetails?.sellerName ? `${v.sellerDetails.sellerName} · ` : ""}
                              {v.sellerDetails?.sellerPhone || v.businessDetails?.businessPhone || ""}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Balance</span>
                          <span
                            className={`text-xs font-extrabold ${
                              balance > 0 ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            {npr(balance)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Withdrawal Amount with Quick Presets */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={fieldLabel}>Withdrawal Amount (NPR) *</span>
            {selectedVendor && currentAvailable > 0 && (
              <span className="text-[11px] text-slate-500">
                Max: <span className="font-bold text-slate-700">{npr(currentAvailable)}</span>
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 pointer-events-none">
              NPR
            </div>
            <input
              className={`${field} pl-12 h-10 ${
                exceedsBalance ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""
              }`}
              inputMode="decimal"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ""));
                setError(null);
              }}
              disabled={!selectedVendor}
            />
          </div>

          {/* Quick Preset Buttons (25%, 50%, 75%, Max) */}
          {selectedVendor && currentAvailable > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Select:</span>
              {[
                { label: "25%", pct: 0.25 },
                { label: "50%", pct: 0.5 },
                { label: "75%", pct: 0.75 },
                { label: "100% (Max)", pct: 1.0 },
              ].map(({ label, pct }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPercent(pct)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 text-slate-700 transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Inline Validation Banner if Amount Exceeds Balance */}
          {exceedsBalance && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>
                Withdrawal amount (<strong>{npr(numAmount)}</strong>) exceeds vendor available balance (
                <strong>{npr(currentAvailable)}</strong>).
              </span>
            </div>
          )}

          {selectedVendor && currentAvailable <= 0 && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>This vendor currently has NPR 0.00 in their wallet. A withdrawal cannot be initiated.</span>
            </div>
          )}
        </div>

        {/* Step 3: Notes / Remarks */}
        <div>
          <span className={fieldLabel}>Notes / Remarks (Optional)</span>
          <input
            className={`${field} h-10`}
            placeholder="e.g. Weekly settlement or payout request"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!selectedVendor}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
