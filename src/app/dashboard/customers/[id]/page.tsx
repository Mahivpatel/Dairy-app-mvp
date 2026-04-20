import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/utils";
import { notFound } from "next/navigation";
import CustomerLedger from "./CustomerLedger";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
};

export default async function CustomerPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const { month: monthParam } = await searchParams;

  // Validate month param — must be YYYY-MM, else fall back to current month
  const isValidMonth = (s: string | undefined): s is string =>
    typeof s === "string" && /^\d{4}-\d{2}$/.test(s);

  const selectedMonth = isValidMonth(monthParam) ? monthParam : currentMonth();

  // Verify customer belongs to this owner; grab stub ledger list for the month switcher
  const customer = await prisma.customer.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      qrId: true,
      name: true,
      phone: true,
      address: true,
      usualBags: true,
      isSuspended: true,
      ledgers: {
        select: { id: true, month: true },
        orderBy: { month: "desc" },
      },
    },
  });

  if (!customer) notFound();

  // Fetch the selected month's ledger with full purchase list
  const ledger = await prisma.ledger.findFirst({
    where: { customerId: id, month: selectedMonth },
    include: { purchases: { orderBy: { date: "asc" } } },
  });

  // Build the month list for the switcher; always include current month
  const allMonths = customer.ledgers.map((l) => l.month);
  if (!allMonths.includes(currentMonth())) {
    allMonths.unshift(currentMonth());
  }

  const data = {
    id: customer.id,
    qrId: customer.qrId,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    usualBags: customer.usualBags,
    isSuspended: customer.isSuspended,
    selectedMonth,
    allMonths,
    ledger: ledger
      ? {
          id: ledger.id,
          month: ledger.month,
          totalBags: ledger.totalBags,
          amountDue: ledger.amountDue,
          isPaid: ledger.isPaid,
          paidAt: ledger.paidAt ? ledger.paidAt.toISOString() : null,
          purchases: ledger.purchases.map((p) => ({
            id: p.id,
            date: p.date.toISOString(),
            bags: p.bags,
          })),
        }
      : null,
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <header className="mb-6">
        <a
          href="/dashboard/customers"
          className="text-blue-600 hover:underline mb-3 inline-block text-sm"
        >
          ← Back to Customers
        </a>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <a
            href={`/customer/${customer.qrId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            Public page →
          </a>
        </div>
      </header>

      <CustomerLedger customer={data} />
    </div>
  );
}