"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  TrendingUp,
  Download,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Building2,
  Smartphone,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorTransactions,
  fetchVendorStats,
  fetchCodDueRiders,
  confirmCodHandover,
  requestVendorWithdrawal,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorTransactionsPage() {
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const stats = vendorState?.stats ?? null;
  const transactions = vendorState?.transactions ?? [];
  const txnsLoading = vendorState?.txnsLoading ?? false;
  const codDueRiders = vendorState?.codDueRiders ?? [];

  const [activeTab, setActiveTab] = useState<"history" | "cod">("history");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [upiId, setUpiId] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    dispatch(fetchVendorTransactions());
    dispatch(fetchVendorStats());
    dispatch(fetchCodDueRiders());
  }, [dispatch]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawMsg({ type: "error", text: "Please enter a valid withdrawal amount." });
      return;
    }
    if (amt > (stats?.availableWithdrawalBalance ?? 0)) {
      setWithdrawMsg({ type: "error", text: "Requested amount exceeds available wallet balance." });
      return;
    }

    setWithdrawLoading(true);
    try {
      const action = await dispatch(
        requestVendorWithdrawal({
          amount: amt,
          paymentMethod: payoutMethod,
          bankDetails:
            payoutMethod === "Bank Transfer"
              ? { bankName, accountNumber, accountHolder }
              : undefined,
          upiId: payoutMethod === "UPI" ? upiId : undefined,
        })
      );

      if (requestVendorWithdrawal.fulfilled.match(action)) {
        setWithdrawMsg({
          type: "success",
          text: "Withdrawal request submitted successfully! Processing within 24 hours.",
        });
        dispatch(fetchVendorStats());
        dispatch(fetchVendorTransactions());
        setTimeout(() => setShowWithdrawModal(false), 1500);
      } else {
        setWithdrawMsg({
          type: "error",
          text: (action.payload as string) || "Failed to submit withdrawal request.",
        });
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleConfirmHandover = async (riderId: string, amount: number) => {
    if (confirm(`Confirm cash handover of ₹${amount} received from this rider?`)) {
      await dispatch(
        confirmCodHandover({
          deliveryBoyId: riderId,
          amountSubmitted: amount,
          paymentMode: "CASH",
        })
      );
      dispatch(fetchCodDueRiders());
      dispatch(fetchVendorStats());
    }
  };

  const availableBalance = stats?.availableWithdrawalBalance ?? 0;
  const totalEarned = stats?.totalEarned ?? 0;
  const pendingSettlement = stats?.pendingSettlement ?? 0;
  const codInCustody = stats?.codCashWithDeliveryBoys ?? 0;

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* ── Breadcrumb & Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
              <Link href="/seller/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-500 font-medium">Finance & Wallet</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Transactions</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Wallet & Settlements
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CircleDollarSign className="w-4 h-4" />
              Request Payout
            </button>
          </div>
        </div>

        {/* ── 4 Wallet Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Available to Withdraw
              </span>
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#0C831F] flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-3">
              ₹{availableBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Ready for instant payout</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Lifetime Earnings
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-3">
              ₹{totalEarned.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Net post commission</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Pending Settlement
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-3">
              ₹{pendingSettlement.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Orders in transit/clearing</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                COD in Rider Custody
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-3">
              ₹{codInCustody.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Due for handover at hub</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[#0C831F] text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveTab("cod")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "cod"
                ? "bg-[#0C831F] text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            COD Cash Handover ({codDueRiders.length})
          </button>
        </div>

        {/* ── TAB 1: Transaction History ── */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Transaction Type</th>
                    <th className="px-5 py-3.5">Gross Amount</th>
                    <th className="px-5 py-3.5">Commission</th>
                    <th className="px-5 py-3.5">Net Amount</th>
                    <th className="px-5 py-3.5">Payment Method</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              tx.netAmount >= 0
                                ? "bg-green-50 text-[#0C831F]"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {tx.netAmount >= 0 ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          {tx.type}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-500">
                          ₹{tx.grossAmount || tx.amount}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          -₹{tx.commission || 0}
                        </td>
                        <td className="px-5 py-3.5 font-black text-gray-900">
                          ₹{tx.netAmount || tx.amount}
                        </td>
                        <td className="px-5 py-3.5 uppercase font-semibold text-gray-600">
                          {tx.paymentMethod || "COD"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-green-100 text-green-800">
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: COD Cash Handover ── */}
        {activeTab === "cod" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Rider Cash-on-Delivery Collections
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Riders who collected cash from customers and must submit it to your store hub.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Delivery Boy</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Orders Delivered</th>
                    <th className="px-5 py-3.5">Total Cash Due</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {codDueRiders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                        No outstanding COD cash due from delivery boys.
                      </td>
                    </tr>
                  ) : (
                    codDueRiders.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {r.deliveryBoy?.fullName || "Assigned Rider"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {r.deliveryBoy?.phone || "N/A"}
                        </td>
                        <td className="px-5 py-3.5 font-semibold">
                          {r.ordersCount || r.orders?.length || 0} order(s)
                        </td>
                        <td className="px-5 py-3.5 font-black text-gray-900 text-sm">
                          ₹{r.totalDue}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() =>
                              handleConfirmHandover(r.deliveryBoy._id, r.totalDue)
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Confirm Handover Received
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Request Withdrawal Modal ── */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">
                  Request Payout / Withdrawal
                </h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {withdrawMsg && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    withdrawMsg.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {withdrawMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{withdrawMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4 mt-4">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Available Balance:</span>
                  <span className="font-black text-gray-900 text-sm">
                    ₹{availableBalance.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Amount to Withdraw (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    max={availableBalance}
                    required
                    placeholder="e.g. 5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-sm font-bold px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Payout Destination
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                    <option value="UPI">UPI ID / VPA</option>
                  </select>
                </div>

                {payoutMethod === "Bank Transfer" ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC Bank, SBI, Nabil Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. vendor@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {withdrawLoading ? "Submitting..." : "Submit Payout Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
