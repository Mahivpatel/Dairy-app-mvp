import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/utils";
import { NextResponse } from "next/server";

// GET /api/customers - List all customers for logged-in owner
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      qrId: c.qrId,
      name: c.name,
      phone: c.phone,
      address: c.address,
      usualBags: c.usualBags,
      isActive: c.isActive,
      isSuspended: c.isSuspended,
      createdAt: c.createdAt,
      ledger: c.ledgers[0] ?? null,
    }))
  );
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, address, usualBags } = body;

  if (!name || !phone || !address) {
    return NextResponse.json(
      { error: "Name, phone, and address are required" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      address,
      usualBags: usualBags ?? 2,
      userId: user.id,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}