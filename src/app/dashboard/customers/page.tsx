import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/utils";
import CustomersPageClient from "./CustomersPageClient";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const month = currentMonth();

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      ledgers: {
        where: { month },
        select: {
          id: true,
          totalBags: true,
          amountDue: true,
          isPaid: true,
        },
      },
    },
  });

  const data = customers.map((c) => ({
    id: c.id,
    qrId: c.qrId,
    name: c.name,
    phone: c.phone,
    address: c.address,
    usualBags: c.usualBags,
    isActive: c.isActive,
    isSuspended: c.isSuspended,
    createdAt: c.createdAt.toISOString(),
    ledger: c.ledgers[0] ?? null,
  }));

  return <CustomersPageClient customers={data} />;
}