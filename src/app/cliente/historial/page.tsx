import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripHistoryList } from "@/components/viajes/TripHistoryList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ClienteHistorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("client_id", user.id)
    .in("status", ["FINISHED", "CANCELLED"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/cliente" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-gray-800">Mis viajes</h1>
      </header>
      <div className="p-4">
        <TripHistoryList trips={trips ?? []} role="CLIENT" />
      </div>
    </div>
  );
}
