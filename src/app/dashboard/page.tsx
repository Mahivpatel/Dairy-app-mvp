import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/utils";
import { ScanLine, Users, BarChart3, ShoppingBag, IndianRupee, Clock, UserCheck, Settings } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const month = currentMonth();

  // Fetch all stats in parallel
  const [monthlyLedgers, activeCustomers, totalCustomers] = await Promise.all([
    // Current month ledgers for this owner
    prisma.ledger.findMany({
      where: {
        customer: { userId: user.id },
        month,
      },
      select: {
        totalBags: true,
        amountDue: true,
        isPaid: true,
      },
    }),
    // Active customers count
    prisma.customer.count({
      where: { userId: user.id, isActive: true, isSuspended: false },
    }),
    // Total customers
    prisma.customer.count({
      where: { userId: user.id },
    }),
  ]);

  // Aggregate monthly stats
  const totalBags = monthlyLedgers.reduce((sum, l) => sum + l.totalBags, 0);
  const totalAmount = monthlyLedgers.reduce((sum, l) => sum + l.amountDue, 0);
  const pendingPayments = monthlyLedgers.filter((l) => !l.isPaid).length;

  const formattedMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              {user.name?.charAt(0).toUpperCase() || "D"}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {`${user.name}'s Dairy`}
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {formattedMonth} Overview
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {/* Total Bags */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Bags</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900">{totalBags}</p>
              <p className="text-xs text-gray-400 mt-1">this month</p>
            </div>
          </div>

          {/* Amount Due */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Amount Due</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900">₹{totalAmount.toFixed(0)}</p>
              <p className="text-xs text-gray-400 mt-1">pending & paid</p>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
              <p className="text-3xl sm:text-4xl font-bold text-amber-600">{pendingPayments}</p>
              <p className="text-xs text-gray-400 mt-1">unpaid ledgers</p>
            </div>
          </div>

          {/* Active Customers */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-violet-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-violet-50 rounded-xl text-violet-600">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Customers</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                <span className="text-violet-600">{activeCustomers}</span>
                <span className="text-gray-300 text-xl">/{totalCustomers}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">active / total</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Record Sale - Primary Action */}
            <a
              href="/dashboard/record-sale"
              className="group relative overflow-hidden flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-5 sm:p-6 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ScanLine className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Record Sale</p>
                  <p className="text-sm text-blue-100">Scan QR or select customer</p>
                </div>
              </div>
            </a>

            {/* Customers */}
            <a
              href="/dashboard/customers"
              className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="p-3 bg-violet-50 rounded-xl text-violet-600 group-hover:bg-violet-100 transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Customers</p>
                <p className="text-sm text-gray-500">Manage your customer list</p>
              </div>
            </a>

            {/* Ledgers */}
            <a
              href="/dashboard/ledgers"
              className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ledgers</p>
                <p className="text-sm text-gray-500">View monthly billing</p>
              </div>
            </a>
            {/* Settings */}
            <a
              href="/dashboard/settings"
              className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-slate-100 transition-colors">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Settings</p>
                <p className="text-sm text-gray-500">Configure dairy settings</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}