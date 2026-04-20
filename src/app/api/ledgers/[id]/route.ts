import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// GET /api/ledgers/[id] - Get single ledger with purchases
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ledger = await prisma.ledger.findFirst({
    where: {
      id,
      customer: { userId: user.id },
    },
    include: {
      customer: true,
      purchases: { orderBy: { date: "asc" } },
    },
  });

  if (!ledger) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(ledger);
}

// PUT /api/ledgers/[id] - Mark as paid
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
  const existing = await prisma.ledger.findFirst({
    where: { id, customer: { userId: user.id } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ledger = await prisma.ledger.update({
    where: { id },
    data: {
      isPaid: body.isPaid,
      paidAt: body.isPaid ? new Date() : null,
    },
  });

  return NextResponse.json(ledger);
}

// PATCH /api/ledgers/[id] - Mark as paid
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
  const existing = await prisma.ledger.findFirst({
    where: { id, customer: { userId: user.id } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ledger = await prisma.ledger.update({
    where: { id },
    data: {
      isPaid: body.isPaid ?? true,
      paidAt: body.isPaid !== false ? new Date() : null,
    },
  });

  return NextResponse.json(ledger);
}