"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { useVendor } from "@/lib/seller/useVendor";
import * as api from "@/lib/seller/api";
import { npr } from "@/lib/seller/format";
import { Modal, btn, field, fieldLabel } from "./ui";

/** App: transaction.tsx "Withdraw Payout" modal */
export default function WithdrawModal({
  open,
  onClose,
  available,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  available: number;
  onDone: (message: string) => void;
}) {
  const bank = useVendor().vendorProfile?.bankDetails;
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setAmount("");
    setNotes("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError("Please enter a valid withdrawal amount.");
    if (amt > available) return setError(`You can withdraw at most ${npr(available)}.`);
    setBusy(true);
    setError(null);
    try {
      const r = await api.requestWithdrawal(amt, notes.trim() || undefined);
      onDone(r.message || `Withdrawal request for ${npr(amt)} submitted.`);
      close();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Withdraw Payout"
      onClose={close}
      footer={
        <>
          <button type="button" onClick={close} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy || !bank?.accountNumber} onClick={submit} className={btn.primary}>
            {busy ? "Submitting…" : "Confirm Withdrawal"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-vendor-soft p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-vendor-dark">Available to withdraw</span>
          <span className="text-lg font-extrabold text-vendor-dark">{npr(available)}</span>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 text-xs flex items-start gap-2.5">
          <Landmark className="w-4 h-4 text-vendor mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-slate-800">Payout Destination</p>
            {bank?.accountNumber ? (
              <p className="text-slate-600 mt-0.5">
                {bank.bankName} · A/C ••••{bank.accountNumber.slice(-4)} · {bank.accountHolderName}
                {bank.ifscCode ? ` · ${bank.ifscCode}` : ""}
              </p>
            ) : (
              <p className="text-amber-700 mt-0.5">
                No bank account on file.{" "}
                <Link href="/seller/onboarding" className="font-bold underline">
                  Add bank details
                </Link>{" "}
                before withdrawing.
              </p>
            )}
          </div>
        </div>
        <label className="block">
          <span className={fieldLabel}>Withdrawal Amount (NPR)</span>
          <input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 5000" />
        </label>
        {/* Quick amounts — app: Finance.tsx [500, 1000, 2500, 5000] + Max */}
        <div className="flex flex-wrap gap-2">
          {[500, 1000, 2500, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={amt > available}
              onClick={() => setAmount(String(amt))}
              className="px-3 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-vendor-dark cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {npr(amt)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount(String(Math.floor(available)))}
            className="px-3 py-1 rounded-full border border-vendor-200 bg-vendor-soft text-xs font-bold text-vendor-dark cursor-pointer"
          >
            Max
          </button>
        </div>
        <label className="block">
          <span className={fieldLabel}>Notes (optional)</span>
          <input className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Weekly settlement" />
        </label>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
