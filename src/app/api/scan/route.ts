import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/utils";
import { NextResponse } from "next/server";

// POST /api/scan - Record purchase by scanning QR code
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { qrId, bags } = body;

  if (!qrId) {
    return NextResponse.json({ error: "qrId is required" }, { status: 400 });
  }

  // Find customer by qrId and verify ownership
  const customer = await prisma.customer.findFirst({
    where: { qrId, userId: user.id },
    include: { user: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (customer.isSuspended) {
    return NextResponse.json(
      { error: "Customer is suspended", customer },
      { status: 400 }
    );
  }

  const purchaseDate = new Date();
  purchaseDate.setHours(0, 0, 0, 0);

  const month = currentMonth();
  const pricePerBag = customer.user.pricePerBag;
  const bagsToRecord = bags ?? customer.usualBags;

  // Get or create ledger for current month
  const ledger = await prisma.ledger.upsert({
    where: {
      customerId_month: { customerId: customer.id, month },
    },
    create: {
      customerId: customer.id,
      month,
      totalBags: 0,
      amountDue: 0,
    },
    update: {},
  });

  // Check for existing purchase today
  const existing = await prisma.purchase.findFirst({
    where: { customerId: customer.id, date: purchaseDate },
  });

  let purchase;

  if (existing) {
    // Increment existing purchase
    purchase = await prisma.$transaction([
      prisma.purchase.update({
        where: { id: existing.id },
        data: { bags: { increment: bagsToRecord } },
      }),
      prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          totalBags: { increment: bagsToRecord },
          amountDue: { increment: bagsToRecord * pricePerBag },
        },
      }),
    ]);
    purchase = purchase[0];
  } else {
    // Create new purchase
    purchase = await prisma.$transaction([
      prisma.purchase.create({
        data: {
          customerId: customer.id,
          ledgerId: ledger.id,
          date: purchaseDate,
          bags: bagsToRecord,
        },
      }),
      prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          totalBags: { increment: bagsToRecord },
          amountDue: { increment: bagsToRecord * pricePerBag },
        },
      }),
    ]);
    purchase = purchase[0];
  }

  return NextResponse.json({
    purchase,
    customer: { id: customer.id, name: customer.name, qrId: customer.qrId },
    todayTotal: existing ? existing.bags + bagsToRecord : bagsToRecord,
  });
}