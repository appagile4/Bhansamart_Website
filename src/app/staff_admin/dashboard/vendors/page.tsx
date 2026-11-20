"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronRight, MapPin, Search, Store } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { STAFF_BASE as S } from "@/lib/admin/console";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, Tabs, field } from "@/components/admin/ui";

// app: StaffAdminMain/vendors.tsx — assigned stores, search by name / city / state, open / closed filter
const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "CLOSED", label: "Closed" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const nameOf = (v: api.AssignedStore) => v.storeName || v.businessDetails?.businessName || "Unnamed Store";
const isVerified = (v: api.AssignedStore) =>
  v.status === "approved" ||
  v.verificationStatus === "approved" ||
  v.businessDetails?.verificationStatus === "approved";

export default function StaffStoresPage() {
  const q = useAsync(() => api.getAssignedStores(), "staff-stores");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const all = useMemo(() => q.data || [], [q.data]);
  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return all.filter((v) => {
      const open = v.isStoreOpen ?? true;
      if (filter === "OPEN" && !open) return false;
      if (filter === "CLOSED" && open) return false;
      return !s || [nameOf(v), v.city || "", v.state || ""].some((x) => x.toLowerCase().includes(s));
    });
  }, [all, search, filter]);
  const counts = { ALL: all.length, OPEN: all.filter((v) => v.isStoreOpen ?? true).length, CLOSED: all.filter((v) => !(v.isStoreOpen ?? true)).length };

  return (
    <>
      <PageHeader title="Assigned Stores" subtitle={`${all.length} managed vendors`} />
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stores by name, city or state…" aria-label="Search stores" />
          </div>
          <Tabs tabs={FILTERS} active={filter} onChange={setFilter} counts={counts} />
        </div>
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading assigned stores…" />
        ) : !list.length ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState icon={Store} title={all.length ? "No stores match" : "No stores assigned"} text={all.length ? "Try adjusting your search query." : "Contact the platform super admin to get stores assigned."} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">
            {list.map((v) => {
              const open = v.isStoreOpen ?? true;
              return (
                <Link
                  key={v._id}
                  href={`${S}/vendors/${v._id}`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4.5 flex flex-col justify-between gap-3 hover:border-sky-300 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-11 h-11 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-100">
                        <Store className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{nameOf(v)}</p>
                          {isVerified(v) && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {v.status && !["approved", "active"].includes(String(v.status).toLowerCase()) && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${String(v.status).toLowerCase() === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                              {String(v.status)}
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" /> {[v.city, v.state].filter(Boolean).join(", ") || "Nepal"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1.5 ${
                        open
                          ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                          : "bg-[#FEF2F2] text-[#DC2626] border border-red-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
                      {open ? "Open" : "Closed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-medium text-slate-500">
                      Type: <span className="font-bold text-slate-700">{v.businessDetails?.businessType || "Retail"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7]">
                      View Store <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
