import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/customer-profile/[qrId]/regenerate-qr - Generate new qrId (public, no auth)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const { qrId } = await params;

  // Verify customer exists
  const existing = await prisma.customer.findUnique({
    where: { qrId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.isSuspended) {
    return NextResponse.json({ error: "Cannot regenerate QR for suspended account" }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { qrId },
    data: { qrId: crypto.randomUUID() },
  });

  return NextResponse.json({
    qrId: customer.qrId,
  });
}