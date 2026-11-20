"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDate, initials, npr } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, btn, field } from "@/components/admin/ui";

const PAGE_SIZE = 30;

/** app: Screens/adminScreens/customers.tsx */
export default function CustomersPage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useAsync(() => api.getCustomers({ search: search || undefined, page, limit: PAGE_SIZE }), `${search}|${page}`);
  const list = q.data?.data || [];

  return (
    <>
      <PageHeader title="Customer Directory" subtitle={`${q.data?.total ?? 0} registered customers`} />
      <div className="space-y-4">
        <form
          className="flex gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(input.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search name, email or phone…" aria-label="Search customers" />
          </div>
          <button type="submit" className={btn.primary}>Search</button>
        </form>
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading customers…" />
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100"><EmptyState icon={Users} title="No customers found" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
            {list.map((c) => (
              <Link key={c._id} href={`/admin/dashboard/customers/${c._id}`} className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-sky-300 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-sky-100 text-sky-800 font-bold text-sm flex items-center justify-center shrink-0">{initials(c.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{c.isActive === false ? "Inactive" : "Active"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mt-3 text-xs">
                  <div className="rounded-lg bg-slate-50 py-2"><p className="text-sm font-extrabold">{c.totalOrders}</p><p className="text-slate-500">Orders</p></div>
                  <div className="rounded-lg bg-slate-50 py-2"><p className="text-sm font-extrabold">{c.completedOrders}</p><p className="text-slate-500">Delivered</p></div>
                  <div className="rounded-lg bg-slate-50 py-2"><p className="text-sm font-extrabold truncate px-1">{npr(c.totalSpend)}</p><p className="text-slate-500">Spent</p></div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Joined {formatDate(c.createdAt)}{c.rewardPoints ? ` · ${c.rewardPoints} reward pts` : ""}</p>
              </Link>
            ))}
          </div>
        )}
        {(q.data?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-slate-600">Page {page} of {q.data?.totalPages}</span>
            <button type="button" disabled={page >= (q.data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </>
  );
}
