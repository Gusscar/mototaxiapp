import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientProfile } from "@/components/cliente/ClientProfile";
import { ReferralSection } from "@/components/cliente/ReferralSection";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ClientePerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const p = profile as {
    id: string; name: string; email: string; phone: string | null;
    referral_code: string | null; wallet_balance: number;
  } | null;

  const { count: totalTrips } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("status", "FINISHED");

  const { count: totalReferrals } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/cliente" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-gray-800">Mi perfil</h1>
      </header>
      <div className="p-4 space-y-4">
        <ClientProfile
          profile={p ?? { id: user.id, name: "", email: user.email ?? "", phone: null }}
          totalTrips={totalTrips ?? 0}
        />
        {p?.referral_code && (
          <ReferralSection
            referralCode={p.referral_code}
            totalReferrals={totalReferrals ?? 0}
            totalEarned={(totalReferrals ?? 0) * 5}
            walletBalance={p.wallet_balance ?? 0}
          />
        )}
      </div>
    </div>
  );
}
