"use client";

import { useState, useMemo } from "react";

type Ledger = {
  id: string;
  totalBags: number;
  amountDue: number;
  isPaid: boolean;
} | null;

type Customer = {
  id: string;
  qrId: string;
  name: string;
  phone: string;
  address: string;
  usualBags: number;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  ledger: Ledger;
};

type Props = {
  customers: Customer[];
};

type Filter = "all" | "paid" | "pending" | "suspended";

export default function CustomerList({ customers }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let result = customers;

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    // Apply filter
    switch (filter) {
      case "paid":
        result = result.filter((c) => c.ledger?.isPaid === true);
        break;
      case "pending":
        result = result.filter(
          (c) => c.ledger && !c.ledger.isPaid
        );
        break;
      case "suspended":
        result = result.filter((c) => c.isSuspended);
        break;
    }

    return result;
  }, [customers, search, filter]);

  const counts = useMemo(() => {
    const paid = customers.filter((c) => c.ledger?.isPaid === true).length;
    const pending = customers.filter((c) => c.ledger && !c.ledger.isPaid).length;
    const suspended = customers.filter((c) => c.isSuspended).length;
    return { all: customers.length, paid, pending, suspended };
  }, [customers]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "paid", "pending", "suspended"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-75">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search
            ? "No customers match your search"
            : filter === "all"
            ? "No customers yet"
            : `No ${filter} customers`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border rounded-lg p-4 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {customer.name}
                    {customer.isSuspended && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Suspended
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                  <p className="text-sm text-gray-400">{customer.address}</p>
                </div>
                <div className="text-right">
                  {customer.ledger ? (
                    <>
                      <p className="text-sm text-gray-500">
                        {customer.ledger.totalBags} bags
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          customer.ledger.isPaid
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        ₹{customer.ledger.amountDue.toFixed(0)}
                        {customer.ledger.isPaid ? " (paid)" : " due"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No purchases</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/dashboard/customers/${customer.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View
                </a>
                <a
                  href={`/customer/${customer.qrId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:underline"
                >
                  Public page
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}