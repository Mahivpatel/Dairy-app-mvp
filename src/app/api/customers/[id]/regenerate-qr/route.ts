import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// PATCH /api/customers/[id]/regenerate-qr - Generate new qrId
export async function PATCH(
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

  const customer = await prisma.customer.update({
    where: { id },
    data: { qrId: crypto.randomUUID() },
  });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    qrId: customer.qrId,
  });
}