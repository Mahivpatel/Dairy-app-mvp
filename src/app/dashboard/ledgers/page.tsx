import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/utils";
import LedgersClient from "./LedgersClient";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function LedgersPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { month: monthParam } = await searchParams;

  const isValidMonth = (s: string | undefined): s is string =>
    typeof s === "string" && /^\d{4}-\d{2}$/.test(s);

  const selectedMonth = isValidMonth(monthParam) ? monthParam : currentMonth();

  // All distinct months that have at least one ledger for this owner
  const monthRows = await prisma.ledger.findMany({
    where: { customer: { userId: user.id } },
    select: { month: true },
    distinct: ["month"],
    orderBy: { month: "desc" },
  });

  const allMonths = monthRows.map((r) => r.month);
  if (!allMonths.includes(currentMonth())) {
    allMonths.unshift(currentMonth());
  }

  // All customers with their ledger for the selected month (if any)
  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      isSuspended: true,
      ledgers: {
        where: { month: selectedMonth },
        select: {
          id: true,
          month: true,
          totalBags: true,
          amountDue: true,
          isPaid: true,
          paidAt: true,
        },
      },
    },
  });

  // Aggregate totals for the month
  const rows = customers.map((c) => ({
    customerId: c.id,
    name: c.name,
    phone: c.phone,
    isSuspended: c.isSuspended,
    ledger: c.ledgers[0]
      ? {
          id: c.ledgers[0].id,
          totalBags: c.ledgers[0].totalBags,
          amountDue: c.ledgers[0].amountDue,
          isPaid: c.ledgers[0].isPaid,
          paidAt: c.ledgers[0].paidAt
            ? c.ledgers[0].paidAt.toISOString()
            : null,
        }
      : null,
  }));

  const totalBags = rows.reduce((s, r) => s + (r.ledger?.totalBags ?? 0), 0);
  const totalAmount = rows.reduce(
    (s, r) => s + (r.ledger?.amountDue ?? 0),
    0
  );
  const paidCount = rows.filter((r) => r.ledger?.isPaid).length;
  const pendingCount = rows.filter((r) => r.ledger && !r.ledger.isPaid).length;

  return (
    <LedgersClient
      selectedMonth={selectedMonth}
      allMonths={allMonths}
      rows={rows}
      summary={{ totalBags, totalAmount, paidCount, pendingCount }}
    />
  );
}
