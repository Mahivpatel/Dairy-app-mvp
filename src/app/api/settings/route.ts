import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { dairyName, pricePerBag } = body;

  const dataToUpdate: any = {};
  if (dairyName !== undefined) dataToUpdate.dairyName = dairyName;
  if (pricePerBag !== undefined) dataToUpdate.pricePerBag = Number(pricePerBag);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: dataToUpdate,
  });

  return NextResponse.json({ success: true, user: updatedUser });
}
