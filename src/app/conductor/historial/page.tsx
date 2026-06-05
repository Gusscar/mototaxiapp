import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripHistoryList } from "@/components/viajes/TripHistoryList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ConductorHistorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("driver_id", user.id)
    .in("status", ["FINISHED", "CANCELLED"])
    .order("created_at", { ascending: false })
    .limit(50);

  // Calcular ganancias totales
  const totalEarnings = (trips ?? [])
    .filter((t) => t.status === "FINISHED" && t.price)
    .reduce((sum, t) => sum + Number(t.price), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/conductor" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-gray-800">Mis viajes</h1>
      </header>
      <div className="p-4 space-y-4">
        {/* Resumen de ganancias */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Ganancias totales</p>
          <p className="text-2xl font-bold text-orange-500">
            S/ {totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {(trips ?? []).filter((t) => t.status === "FINISHED").length} viajes completados
          </p>
        </div>
        <TripHistoryList trips={trips ?? []} role="DRIVER" />
      </div>
    </div>
  );
}
