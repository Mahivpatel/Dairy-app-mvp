import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/utils";
import { NextResponse } from "next/server";

// GET /api/customers/[id] - Get single customer with current month ledger
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const month = currentMonth();

  const customer = await prisma.customer.findFirst({
    where: { id, userId: user.id },
    include: {
      ledgers: {
        where: { month },
        include: { purchases: { orderBy: { date: "desc" } } },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...customer,
    ledger: customer.ledgers[0] ?? null,
  });
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const existing = await prisma.customer.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: body.name,
      phone: body.phone,
      address: body.address,
      usualBags: body.usualBags,
      isActive: body.isActive,
      isSuspended: body.isSuspended,
    },
  });

  return NextResponse.json(customer);
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.customer.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.customer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// PATCH /api/customers/[id] - Toggle suspension
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const existing = await prisma.customer.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: { isSuspended: body.isSuspended ?? !existing.isSuspended },
  });

  return NextResponse.json(customer);
}