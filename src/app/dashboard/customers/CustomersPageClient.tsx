"use client";

import { useState } from "react";
import CustomerList from "./CustomerList";
import AddCustomerModal from "./AddCustomerModal";

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

export default function CustomersPageClient({ customers }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="p-8 max-w-2xl mx-auto">
        <header className="mb-6">
          <a
            href="/dashboard"
            className="text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </a>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Customers</h1>
            <button
              id="open-add-customer-modal"
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              + Add Customer
            </button>
          </div>
        </header>

        <CustomerList customers={customers} />
      </div>

      <AddCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
