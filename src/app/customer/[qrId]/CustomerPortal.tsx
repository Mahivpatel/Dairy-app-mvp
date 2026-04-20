"use client";

import { useState, useEffect } from "react";
import { Calendar, History, User, ShoppingBag, QrCode, AlertTriangle, Store, IndianRupee } from "lucide-react";

type Purchase = {
  id: string;
  date: string;
  bags: number;
};

type Ledger = {
  id: string;
  month: string;
  totalBags: number;
  amountDue: number;
  isPaid: boolean;
  purchases: Purchase[];
} | null;

type CustomerData = {
  qrId: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    isSuspended: boolean;
    usualBags: number;
  };
  dairy: {
    name: string;
    pricePerBag: number;
  };
  ledger: Ledger;
};

type Props = {
  data: CustomerData;
};

function getDaysInMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon, 0).getDate();
}

function getFirstDayOfMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).getDay();
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CustomerPortal({ data }: Props) {
  const [tab, setTab] = useState<"calendar" | "history">("calendar");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrId, setQrId] = useState(data.qrId);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    setQrUrl(`${window.location.origin}/customer/${qrId}`);
  }, [qrId]);

  const [showQrConfirm, setShowQrConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [customer, setCustomer] = useState(data.customer);
  const [formData, setFormData] = useState({
    name: data.customer.name,
    phone: data.customer.phone,
    address: data.customer.address,
  });

  if (customer.isSuspended) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account Suspended</h1>
          <p className="text-gray-600">
            Please contact <span className="font-medium">{data.dairy.name}</span> to resolve this issue.
          </p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customer-profile/${qrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setCustomer({
          ...customer,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateQr = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/customer-profile/${qrId}/regenerate-qr`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setQrId(result.qrId);
        setShowQrConfirm(false);
      }
    } finally {
      setRegenerating(false);
    }
  };

  const ledger = data.ledger;
  const month = ledger?.month ?? formatDate(new Date()).slice(0, 7);
  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);

  const purchaseMap = new Map<string, number>();
  if (ledger?.purchases) {
    for (const p of ledger.purchases) {
      const dateStr = typeof p.date === "string" ? p.date.split("T")[0] : formatDate(new Date(p.date));
      purchaseMap.set(dateStr, p.bags);
    }
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array(firstDay).fill(null);
  const today = formatDate(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 opacity-80" />
            <p className="text-sm text-blue-100">{data.dairy.name}</p>
          </div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-blue-100 flex items-center gap-1 mt-1">
            <IndianRupee className="w-4 h-4" />
            {data.dairy.pricePerBag.toFixed(0)}/bag
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* QR Code Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <QrCode className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">Your QR Code</span>
            </div>
            <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100">
              {qrUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    qrUrl
                  )}`}
                  alt="Your QR Code"
                  className="w-40 h-40"
                  key={qrId}
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 animate-pulse rounded-lg" />
              )}
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              Show this to the dairy owner when purchasing
            </p>
            <button
              onClick={() => setShowQrConfirm(true)}
              className="mt-3 w-full text-center text-sm text-red-600 hover:text-red-700 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Regenerate QR Code
            </button>
          </div>
        </div>

        {/* Summary Card */}
        {ledger && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-1">
                {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{ledger.totalBags}</p>
                    <p className="text-sm text-gray-500">bags this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold ${
                    ledger.isPaid
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    <IndianRupee className="w-4 h-4" />
                    {ledger.amountDue.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {ledger.isPaid ? "Paid" : "Due"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-1.5 flex">
          <button
            onClick={() => setTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === "calendar"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === "history"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Calendar Tab */}
        {tab === "calendar" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-gray-400 text-xs font-medium py-2">{d}</div>
                ))}
                {padding.map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
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
                      className={`py-1.5 rounded-lg text-sm select-none ${
                        hasPurchase
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold shadow-sm"
                          : isToday
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div>{day}</div>
                      {hasPurchase && (
                        <div className="text-[9px] leading-tight opacity-90">{bags}bg</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded-sm inline-block" />
                  Purchase
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm ring-2 ring-blue-300 bg-blue-100 inline-block" />
                  Today
                </span>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {ledger?.purchases && ledger.purchases.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {[...ledger.purchases].reverse().map((p) => {
                  const dateStr = typeof p.date === "string" ? p.date.split("T")[0] : formatDate(new Date(p.date));
                  const date = new Date(dateStr + "T00:00:00");
                  return (
                    <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-gray-600">
                        {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {p.bags} bag{p.bags > 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No purchases this month</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-violet-50 rounded-lg">
                <User className="w-5 h-5 text-violet-600" />
              </div>
              <span className="font-medium text-gray-900">My Profile</span>
            </div>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address,
                      });
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-gray-600 text-sm mt-1">{customer.phone}</p>
                <p className="text-gray-500 text-sm">{customer.address}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Usual Bags */}
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl shadow-md p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-violet-100">Usual daily order</p>
              <p className="text-2xl font-bold">{customer.usualBags} bag{customer.usualBags > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showQrConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Regenerate QR Code?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This will generate a new QR code and invalidate the old one. Your purchase history will be preserved.
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
              Make sure to bookmark this page before regenerating.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRegenerateQr}
                disabled={regenerating}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {regenerating ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                onClick={() => setShowQrConfirm(false)}
                disabled={regenerating}
                className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}