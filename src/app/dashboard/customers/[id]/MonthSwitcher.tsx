"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = {
  customerId: string;
  selectedMonth: string;
  allMonths: string[];
};

/** Formats "2026-04" → "April 2026" */
function formatMonthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function MonthSwitcher({
  customerId,
  selectedMonth,
  allMonths,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const month = e.target.value;
    router.push(`${pathname}?month=${month}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="month-select"
        className="text-sm font-medium text-gray-600 shrink-0"
      >
        Month
      </label>
      <select
        id="month-select"
        value={selectedMonth}
        onChange={handleChange}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      >
        {allMonths.map((m) => (
          <option key={m} value={m}>
            {formatMonthLabel(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
