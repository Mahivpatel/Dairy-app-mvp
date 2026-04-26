import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/app/dashboard/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Dairy Profile</h2>
            <SettingsForm initialDairyName={user.dairyName} initialPricePerBag={user.pricePerBag} />
          </div>
        </div>
      </div>
    </div>
  );
}
