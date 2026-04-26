import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { isActive: true, isSuspended: false },
  });

  const month = currentMonth();

  const ledgersToCreate = customers.map((c) => ({
    customerId: c.id,
    month,
    totalBags: 0,
    amountDue: 0,
  }));

  if (ledgersToCreate.length > 0) {
    await prisma.ledger.createMany({
      data: ledgersToCreate,
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true, month, count: ledgersToCreate.length });
}
