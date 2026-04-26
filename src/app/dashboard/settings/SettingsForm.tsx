"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({
  initialDairyName,
  initialPricePerBag,
}: {
  initialDairyName: string;
  initialPricePerBag: number;
}) {
  const router = useRouter();
  const [dairyName, setDairyName] = useState(initialDairyName);
  const [pricePerBag, setPricePerBag] = useState(initialPricePerBag);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dairyName, pricePerBag: Number(pricePerBag) }),
      });

      if (res.ok) {
        setMessage("Settings saved successfully.");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save settings.");
      }
    } catch (error) {
      setMessage("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="dairyName" className="block text-sm font-medium text-gray-700">
          Dairy Name
        </label>
        <input
          type="text"
          id="dairyName"
          value={dairyName}
          onChange={(e) => setDairyName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="pricePerBag" className="block text-sm font-medium text-gray-700">
          Price Per Bag (₹)
        </label>
        <input
          type="number"
          id="pricePerBag"
          value={pricePerBag}
          onChange={(e) => setPricePerBag(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          required
          min="0"
          step="0.5"
        />
        <p className="mt-1 text-xs text-gray-500">
          Changes apply to future purchases only. Existing ledgers will keep the price they were created with.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
