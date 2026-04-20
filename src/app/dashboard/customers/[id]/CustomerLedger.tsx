"use client";

import MonthSwitcher from "./MonthSwitcher";
import MarkPaidButton from "./MarkPaidButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Purchase = {
  id: string;
  date: string; // ISO string
  bags: number;
};

type Ledger = {
  id: string;
  month: string;
  totalBags: number;
  amountDue: number;
  isPaid: boolean;
  paidAt: string | null;
  purchases: Purchase[];
} | null;

type Customer = {
  id: string;
  qrId: string;
  name: string;
  phone: string;
  address: string;
  usualBags: number;
  isSuspended: boolean;
  selectedMonth: string;
  allMonths: string[];
  ledger: Ledger;
};

type Props = {
  customer: Customer;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon, 0).getDate();
}

function getFirstDayOfMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).getDay(); // 0 = Sunday
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LedgerCalendar({
  month,
  purchases,
}: {
  month: string;
  purchases: Purchase[];
}) {
  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);
  const today = todayDateStr();

  // date string → bag count
  const purchaseMap = new Map<string, number>();
  for (const p of purchases) {
    const dateStr = p.date.split("T")[0];
    purchaseMap.set(dateStr, p.bags);
  }

  const padding = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthLabel = new Date(month + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-gray-400 py-1 font-medium">
            {d}
          </div>
        ))}
        {padding.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = `${month}-${String(day).padStart(2, "0")}`;
          const bags = purchaseMap.get(dateStr);
          const isToday = dateStr === today;
          const hasPurchase = bags !== undefined;

          return (
            <div
              key={day}
              title={hasPurchase ? `${bags} bag${bags > 1 ? "s" : ""}` : undefined}
              className={`py-1.5 rounded-md text-sm select-none ${
                hasPurchase
                  ? "bg-green-500 text-white font-semibold"
                  : isToday
                  ? "ring-2 ring-blue-400 text-blue-700 font-medium"
                  : "text-gray-600"
              }`}
            >
              {day}
              {hasPurchase && (
                <div className="text-[9px] leading-tight opacity-80">{bags}bg</div>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-green-500 rounded-sm inline-block" />
          Purchase
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm ring-2 ring-blue-400 inline-block" />
          Today
        </span>
      </div>
    </div>
  );
}

function PurchaseLog({ purchases }: { purchases: Purchase[] }) {
  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm">
        <h3 className="font-semibold text-gray-800 p-4 border-b">
          Purchase Log
        </h3>
        <p className="p-4 text-sm text-gray-400 text-center">
          No purchases this month
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <h3 className="font-semibold text-gray-800 p-4 border-b">
        Purchase Log
        <span className="ml-2 text-sm text-gray-400 font-normal">
          ({purchases.length} {purchases.length === 1 ? "day" : "days"})
        </span>
      </h3>
      <div className="divide-y">
        {[...purchases].reverse().map((p) => {
          const dateStr = p.date.split("T")[0];
          const date = new Date(dateStr + "T00:00:00");
          return (
            <div key={p.id} className="px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {date.toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {p.bags} bag{p.bags > 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CustomerLedger({ customer }: Props) {
  const { ledger, selectedMonth, allMonths } = customer;

  return (
    <div className="space-y-5">
      {/* Customer info card */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {customer.name}
            </h2>
            <p className="text-sm text-gray-500">{customer.phone}</p>
            <p className="text-xs text-gray-400 mt-0.5">{customer.address}</p>
          </div>
          {customer.isSuspended && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium">
              Suspended
            </span>
          )}
        </div>
      </div>

      {/* Month switcher */}
      <MonthSwitcher
        customerId={customer.id}
        selectedMonth={selectedMonth}
        allMonths={allMonths}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-3 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Total Bags</p>
          <p className="text-2xl font-bold text-gray-900">
            {ledger?.totalBags ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Amount Due</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{(ledger?.amountDue ?? 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p
            className={`text-base font-semibold ${
              ledger?.isPaid ? "text-green-600" : "text-orange-500"
            }`}
          >
            {ledger?.isPaid ? "Paid" : "Pending"}
          </p>
          {ledger?.isPaid && ledger.paidAt && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {new Date(ledger.paidAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Mark paid / unpaid button */}
      {ledger ? (
        <MarkPaidButton ledgerId={ledger.id} isPaid={ledger.isPaid} />
      ) : (
        <div className="text-center text-sm text-gray-400 py-2">
          No ledger for this month yet — it will be created on the first purchase.
        </div>
      )}

      {/* Calendar */}
      <LedgerCalendar
        month={selectedMonth}
        purchases={ledger?.purchases ?? []}
      />

      {/* Purchase log */}
      <PurchaseLog purchases={ledger?.purchases ?? []} />
    </div>
  );
}