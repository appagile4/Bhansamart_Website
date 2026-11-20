"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bike, CheckCircle2, HandCoins, Phone, ReceiptText, RefreshCw } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { fetchCodSummary, fetchVendorStats } from "@/redux/slices/vendorSlice";
import * as api from "@/lib/seller/api";
import type { CodRiderDue } from "@/lib/seller/types";
import { formatDate, formatDateTime, npr } from "@/lib/seller/format";
import { Card, EmptyState, LoadingBlock, Modal, PageHeader, btn, field, fieldLabel } from "@/components/vendor/ui";

export default function CodHandoverPage() {
  const dispatch = useAppDispatch();
  const cod = useVendor().codSummary;
  const [refreshing, setRefreshing] = useState(false);
  const [rider, setRider] = useState<CodRiderDue | null>(null);
  const [receipt, setReceipt] = useState<(api.CodHandoverResult & { riderName?: string; message?: string }) | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchCodSummary()), dispatch(fetchVendorStats())]);
    setRefreshing(false);
  };

  return (
    <>
      <PageHeader
        backHref="/seller/dashboard/transactions"
        title="COD Cash Handover"
        subtitle="Collect cash that delivery partners received from customers and confirm it here."
        actions={
          <button type="button" onClick={refresh} className={btn.outline} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {!cod ? (
        <LoadingBlock text="Loading COD summary…" />
      ) : (
        <div className="space-y-4">
          {/* Custody banner */}
          <section className="rounded-2xl bg-gradient-to-br from-violet-700 to-violet-500 text-white p-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <HandCoins className="w-6 h-6" />
            </span>
            <div>
              <p className="text-[11px] font-bold tracking-widest text-violet-100">PENDING STORE SUBMISSION</p>
              <p className="text-3xl font-extrabold">{npr(cod.totalCodPendingSubmission)}</p>
              <p className="text-xs text-violet-100">
                with {cod.ridersCount} delivery partner{cod.ridersCount === 1 ? "" : "s"}
              </p>
            </div>
          </section>

          {/* Riders due */}
          {cod.ridersDue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100">
              <EmptyState icon={CheckCircle2} title="All Clear!" text="No delivery partner is holding COD cash for your store." />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cod.ridersDue.map((r) => (
                <article key={r.deliveryBoy._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                        <Bike className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{r.deliveryBoy.fullName || "Delivery Partner"}</p>
                        {r.deliveryBoy.phone && (
                          <a href={`tel:${r.deliveryBoy.phone}`} className="text-xs text-vendor-teal hover:underline inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {r.deliveryBoy.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-violet-700">{npr(r.totalDue)}</p>
                      <p className="text-[11px] text-slate-500">{r.ordersCount} order(s)</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[11px] font-bold text-slate-600 mb-1.5">Associated Orders:</p>
                    <ul className="space-y-1 text-xs">
                      {r.orders.map((o) => (
                        <li key={o._id} className="flex justify-between gap-2">
                          <Link href={`/seller/dashboard/orders/${o._id}`} className="text-vendor-dark font-semibold hover:underline truncate">
                            {o.orderNumber}
                            <span className="font-normal text-slate-500"> · {o.customerName || "Customer"}</span>
                          </Link>
                          <span className="font-bold text-slate-900 shrink-0">{npr(o.totalAmount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button type="button" onClick={() => setRider(r)} className={`${btn.primary} w-full`}>
                    Confirm Cash Received
                  </button>
                </article>
              ))}
            </div>
          )}

          {/* Recent receipts */}
          <Card title="Recent Handover Receipts">
            {cod.recentHandovers.length === 0 ? (
              <EmptyState icon={ReceiptText} title="No handovers yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {cod.recentHandovers.map((rec) => (
                  <li key={rec._id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Receipt #{rec.receiptNumber}</p>
                      <p className="text-slate-500">
                        {rec.deliveryBoy?.fullName || "Delivery Partner"} · {formatDateTime(rec.createdAt)} · {rec.paymentMode || "CASH"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-700">{npr(rec.amountSubmitted)}</p>
                      {!!rec.remainingBalance && <p className="text-red-600">Short {npr(rec.remainingBalance)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <HandoverModal
        rider={rider}
        onClose={() => setRider(null)}
        onDone={(res) => {
          setReceipt({ ...res, riderName: rider?.deliveryBoy.fullName });
          setRider(null);
          refresh();
        }}
      />

      <Modal
        open={Boolean(receipt)}
        title="Handover Verified!"
        onClose={() => setReceipt(null)}
        footer={
          <button type="button" onClick={() => setReceipt(null)} className={btn.primary}>
            Close Receipt
          </button>
        }
      >
        {receipt && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-vendor-done" />
            </div>
            {receipt.message && <p className="text-center text-xs text-slate-600">{receipt.message}</p>}
            <dl className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              {[
                ["Receipt Number", receipt.receiptNumber || "—"],
                ["Delivery Partner", receipt.riderName || "—"],
                ["Amount Received", npr(receipt.amountSubmitted)],
                ["Remaining Balance", npr(receipt.remainingBalance)],
                ["Mode", receipt.paymentMode || "CASH"],
                ["Date", formatDate(new Date().toISOString())],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-bold text-slate-900">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}

function HandoverModal({
  rider,
  onClose,
  onDone,
}: {
  rider: CodRiderDue | null;
  onClose: () => void;
  onDone: (r: api.CodHandoverResult & { message?: string }) => void;
}) {
  return rider ? <HandoverForm key={rider.deliveryBoy._id} rider={rider} onClose={onClose} onDone={onDone} /> : null;
}

function HandoverForm({ rider, onClose, onDone }: { rider: CodRiderDue; onClose: () => void; onDone: (r: api.CodHandoverResult & { message?: string }) => void }) {
  const [amount, setAmount] = useState(String(rider.totalDue));
  const [mode, setMode] = useState<"CASH" | "UPI">("CASH");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amt = parseFloat(amount);
  const shortfall = !isNaN(amt) && amt < rider.totalDue ? rider.totalDue - amt : 0;

  const submit = async () => {
    if (isNaN(amt) || amt <= 0) return setError("Enter the cash amount you received.");
    if (amt > rider.totalDue) return setError(`Amount can't exceed the ${npr(rider.totalDue)} due.`);
    if (shortfall > 0 && !reason.trim()) return setError("Explain the shortfall so the team can follow up.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.confirmCodHandover({
        deliveryBoyId: rider.deliveryBoy._id,
        amountSubmitted: amt,
        paymentMode: mode,
        notes: notes.trim() || undefined,
        discrepancyReason: shortfall > 0 ? reason.trim() : undefined,
      });
      onDone({ ...r.data, paymentMode: r.data?.paymentMode || mode, amountSubmitted: r.data?.amountSubmitted ?? amt, message: r.message });
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Confirm Store Cash Handover"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={submit} className={btn.primary}>
            {busy ? "Confirming…" : "Confirm Received"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs flex justify-between">
          <span>
            Delivery Partner: <span className="font-bold">{rider.deliveryBoy.fullName}</span>
          </span>
          <span>
            Due <span className="font-extrabold">{npr(rider.totalDue)}</span>
          </span>
        </div>
        <label className="block">
          <span className={fieldLabel}>Amount received (NPR)</span>
          <input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </label>
        <div>
          <span className={fieldLabel}>Payment Mode</span>
          <div className="grid grid-cols-2 gap-2">
            {(["CASH", "UPI"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`h-9 rounded-lg text-xs font-extrabold border cursor-pointer ${mode === m ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-300 text-slate-600"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {shortfall > 0 && (
          <label className="block">
            <span className={`${fieldLabel} text-red-700`}>Shortfall of {npr(shortfall)} — reason *</span>
            <input className={field} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Rider will pay the balance tomorrow" />
          </label>
        )}
        <label className="block">
          <span className={fieldLabel}>Notes (optional)</span>
          <input className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Received at cashier desk" />
        </label>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
