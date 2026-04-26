import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/utils";
import { NextResponse } from "next/server";

// GET /api/purchases - List purchases (optionally filtered by customer)
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const month = searchParams.get("month");

  // Build filter
  const where: { customerId?: string; ledgerId?: string } = {};

  if (customerId) {
    // Verify ownership of customer
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId: user.id },
    });
    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    where.customerId = customerId;
  }

  if (month) {
    const ledger = await prisma.ledger.findFirst({
      where: {
        customerId: customerId || undefined,
        month,
        customer: { userId: user.id },
      },
    });
    if (ledger) {
      where.ledgerId = ledger.id;
    }
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { customer: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(purchases);
}

// POST /api/purchases - Record a purchase
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, bags, date } = body;

  if (!customerId || !bags) {
    return NextResponse.json(
      { error: "customerId and bags are required" },
      { status: 400 }
    );
  }

  // Verify ownership of customer
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, userId: user.id },
    include: { user: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (customer.isSuspended) {
    return NextResponse.json(
      { error: "Customer is suspended" },
      { status: 400 }
    );
  }

  const purchaseDate = date ? new Date(date) : new Date();
  purchaseDate.setHours(0, 0, 0, 0);

  const month = currentMonth();
  const pricePerBag = customer.user.pricePerBag;

  // Get or create ledger for current month
  const ledger = await prisma.ledger.upsert({
    where: {
      customerId_month: { customerId, month },
    },
    create: {
      customerId,
      month,
      totalBags: 0,
      amountDue: 0,
    },
    update: {},
  });

  // Check for existing purchase today
  const existing = await prisma.purchase.findFirst({
    where: { customerId, date: purchaseDate },
  });

  let purchase;
  let bagsDiff = bags;

  if (existing) {
    // Update existing purchase
    bagsDiff = bags - existing.bags;
    purchase = await prisma.$transaction([
      prisma.purchase.update({
        where: { id: existing.id },
        data: { bags },
      }),
      prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          totalBags: { increment: bagsDiff },
          amountDue: (ledger.totalBags + bagsDiff) * pricePerBag,
        },
      }),
    ]);
    purchase = purchase[0];
  } else {
    // Create new purchase
    purchase = await prisma.$transaction([
      prisma.purchase.create({
        data: {
          customerId,
          ledgerId: ledger.id,
          date: purchaseDate,
          bags,
        },
      }),
      prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          totalBags: { increment: bags },
          amountDue: (ledger.totalBags + bags) * pricePerBag,
        },
      }),
    ]);
    purchase = purchase[0];
  }

  return NextResponse.json(purchase, { status: 201 });
}