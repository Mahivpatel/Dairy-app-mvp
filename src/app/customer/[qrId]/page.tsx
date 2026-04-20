import { notFound } from "next/navigation";
import CustomerPortal from "./CustomerPortal";

type Props = {
  params: Promise<{ qrId: string }>;
};

export default async function CustomerPage({ params }: Props) {
  const { qrId } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/customer-profile/${qrId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();

  // Serialize ledger purchases
  if (data.ledger?.purchases) {
    data.ledger.purchases = data.ledger.purchases.map((p: { date: string | Date; id: string; bags: number }) => ({
      ...p,
      date: typeof p.date === "string" ? p.date : p.date.toISOString(),
    }));
  }

  return <CustomerPortal data={data} />;
}