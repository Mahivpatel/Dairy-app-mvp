import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/utils";
import { NextResponse } from "next/server";

// GET /api/customer-profile/[qrId] - Public customer profile (no auth)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const { qrId } = await params;

  const customer = await prisma.customer.findUnique({
    where: { qrId },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      isSuspended: true,
      usualBags: true,
      user: {
        select: {
          dairyName: true,
          pricePerBag: true,
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get current month ledger
  const month = currentMonth();
  const ledger = await prisma.ledger.findUnique({
    where: {
      customerId_month: { customerId: customer.id, month },
    },
    select: {
      id: true,
      month: true,
      totalBags: true,
      amountDue: true,
      isPaid: true,
      purchases: {
        select: {
          id: true,
          date: true,
          bags: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });

  return NextResponse.json({
    qrId,
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      isSuspended: customer.isSuspended,
      usualBags: customer.usualBags,
    },
    dairy: {
      name: customer.user.dairyName,
      pricePerBag: customer.user.pricePerBag,
    },
    ledger,
  });
}

// PATCH /api/customer-profile/[qrId] - Update customer profile (no auth)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const { qrId } = await params;
  const body = await request.json();

  // Verify customer exists
  const existing = await prisma.customer.findUnique({
    where: { qrId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only allow updating certain fields
  const data: { name?: string; phone?: string; address?: string } = {};
  if (body.name) data.name = body.name;
  if (body.phone) data.phone = body.phone;
  if (body.address) data.address = body.address;

  const customer = await prisma.customer.update({
    where: { qrId },
    data,
    select: {
      name: true,
      phone: true,
      address: true,
    },
  });

  return NextResponse.json(customer);
}