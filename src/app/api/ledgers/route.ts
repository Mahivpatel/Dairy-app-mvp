import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// GET /api/ledgers - List ledgers (optionally filtered by customer or month)
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const month = searchParams.get("month");

  const ledgers = await prisma.ledger.findMany({
    where: {
      customer: { userId: user.id },
      ...(customerId && { customerId }),
      ...(month && { month }),
    },
    include: {
      customer: { select: { id: true, name: true, qrId: true } },
      purchases: { orderBy: { date: "desc" } },
    },
    orderBy: { month: "desc" },
  });

  return NextResponse.json(ledgers);
}