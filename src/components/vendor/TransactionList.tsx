"use client";

import React from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import type { SellerTransaction } from "@/lib/seller/types";
import { TXN_LABELS, formatDateTime, isDebitTxn, npr, txnStatusBadge } from "@/lib/seller/format";
import { EmptyState, Pill } from "./ui";

/** Ledger rows shared by Transactions and Finance pages */
export default function TransactionList({ items, emptyTitle = "No Transactions Recorded" }: { items: SellerTransaction[]; emptyTitle?: string }) {
  if (!items.length) return <EmptyState icon={Receipt} title={emptyTitle} text="Order earnings, COD collections and payouts will appear here." />;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((t) => {
        const debit = isDebitTxn(t.type);
        const order = typeof t.order === "object" && t.order ? t.order : null;
        const rider = typeof t.deliveryBoy === "object" && t.deliveryBoy ? t.deliveryBoy : null;
        const amount = t.netAmount ?? t.amount;
        return (
          <li key={t._id} className="px-5 py-3.5 flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${debit ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {debit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{TXN_LABELS[t.type] || t.type.replace(/_/g, " ")}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {formatDateTime(t.createdAt)}
                {order?.orderNumber && (
                  <>
                    {" · "}
                    <Link href={`/seller/dashboard/orders/${order._id}`} className="text-vendor-teal hover:underline">
                      {order.orderNumber}
                    </Link>
                  </>
                )}
                {rider?.fullName ? ` · ${rider.fullName}` : ""}
                {t.paymentMethod ? ` · ${t.paymentMethod}` : ""}
              </p>
              {!!t.commission && (
                <p className="text-[11px] text-slate-400">
                  Gross {npr(t.grossAmount ?? t.amount)} − commission {npr(t.commission)}
                </p>
              )}
              {(t.notes || t.rejectionReason || t.bankReference) && (
                <p className="text-[11px] text-slate-400 truncate">{t.rejectionReason || (t.bankReference ? `Ref ${t.bankReference}` : t.notes)}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-extrabold ${debit ? "text-red-600" : "text-emerald-700"}`}>
                {debit ? "−" : "+"}
                {npr(Math.abs(amount))}
              </p>
              <Pill badge={txnStatusBadge(t.status)} className="mt-1" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
