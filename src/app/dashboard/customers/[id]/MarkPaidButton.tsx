"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  ledgerId: string;
  isPaid: boolean;
};

export default function MarkPaidButton({ ledgerId, isPaid }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ledgers/${ledgerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !isPaid }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update. Please try again.");
        return;
      }
      // Tell the server component to re-fetch — no full reload
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        id="mark-paid-btn"
        className={`w-full py-2.5 rounded-lg font-medium transition disabled:opacity-50 ${
          isPaid
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {loading
          ? "Updating…"
          : isPaid
          ? "Mark as Unpaid"
          : "✓  Mark as Paid"}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
