"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type LedgerRow = {
  id: string;
  totalBags: number;
  amountDue: number;
  isPaid: boolean;
  paidAt: string | null;
} | null;

type CustomerRow = {
  customerId: string;
  name: string;
  phone: string;
  isSuspended: boolean;
  ledger: LedgerRow;
};

type Summary = {
  totalBags: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
};

type Props = {
  selectedMonth: string;
  allMonths: string[];
  rows: CustomerRow[];
  summary: Summary;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// ─── Inline MarkPaid toggle ───────────────────────────────────────────────────

function MarkPaidToggle({
  ledgerId,
  isPaid,
}: {
  ledgerId: string;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger row navigation
    setLoading(true);
    try {
      const res = await fetch(`/api/ledgers/${ledgerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !isPaid }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap ${
        isPaid
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
      }`}
    >
      {loading ? "…" : isPaid ? "✓ Paid" : "Pending"}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LedgersClient({
  selectedMonth,
  allMonths,
  rows,
  summary,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Local filter: all | paid | pending | no-activity
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "none">(
    "all"
  );

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`${pathname}?month=${e.target.value}`);
  }

  const filtered = rows.filter((r) => {
    if (filter === "paid") return r.ledger?.isPaid === true;
    if (filter === "pending") return r.ledger && !r.ledger.isPaid;
    if (filter === "none") return !r.ledger;
    return true;
  });

  const filterCounts = {
    all: rows.length,
    paid: rows.filter((r) => r.ledger?.isPaid === true).length,
    pending: rows.filter((r) => r.ledger && !r.ledger.isPaid).length,
    none: rows.filter((r) => !r.ledger).length,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <a
          href="/dashboard"
          className="text-blue-600 hover:underline text-sm inline-block mb-3"
        >
          ← Back to Dashboard
        </a>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ledgers</h1>
          {/* Month switcher */}
          <select
            id="ledger-month-select"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {allMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {formatMonthLabel(selectedMonth)}
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Total Bags</p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.totalBags}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{summary.totalAmount.toFixed(0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.paidCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-500">
            {summary.pendingCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "paid", label: "Paid" },
            { key: "pending", label: "Pending" },
            { key: "none", label: "No activity" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">({filterCounts[key]})</span>
          </button>
        ))}
      </div>

      {/* Customer rows */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No customers match this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <a
              key={row.customerId}
              href={`/dashboard/customers/${row.customerId}?month=${selectedMonth}`}
              className="flex items-center justify-between bg-white rounded-xl border p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition group"
            >
              {/* Customer info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 group-hover:text-blue-700 transition truncate">
                    {row.name}
                  </span>
                  {row.isSuspended && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded shrink-0">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{row.phone}</p>
              </div>

              {/* Ledger info */}
              <div className="flex items-center gap-4 ml-4 shrink-0">
                {row.ledger ? (
                  <>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{row.ledger.amountDue.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {row.ledger.totalBags} bags
                      </p>
                    </div>
                    <MarkPaidToggle
                      ledgerId={row.ledger.id}
                      isPaid={row.ledger.isPaid}
                    />
                  </>
                ) : (
                  <span className="text-xs text-gray-300 italic">
                    No purchases
                  </span>
                )}
                <span className="text-gray-300 group-hover:text-blue-400 transition text-sm">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
