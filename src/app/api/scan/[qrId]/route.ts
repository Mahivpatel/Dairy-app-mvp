
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { qrId } = await params;

    if (!qrId) {
      return NextResponse.json({ error: "QR ID is required" }, { status: 400 });
    }

    const date = new Date();
    // Get current month in format "YYYY-MM"
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const customer = await prisma.customer.findUnique({
      where: { qrId },
      include: {
        ledgers: {
          where: { month: currentMonth }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Ensure the customer belongs to the logged-in owner
    if (customer.userId !== (session.user as any).id) {
       return NextResponse.json({ error: "Unauthorized access to customer" }, { status: 403 });
    }

    const totalBags = customer.ledgers.length > 0 ? customer.ledgers[0].totalBags : 0;

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      totalBags,
      usualBags: customer.usualBags,
      isSuspended: customer.isSuspended
    });

  } catch (error) {
    console.error("Error scanning QR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
