import { createClient } from "@/lib/supabase/client";

export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", referralCode.toUpperCase().trim())
    .single();

  if (!referrer || (referrer as { id: string }).id === newUserId) return false;

  const referrerId = (referrer as { id: string }).id;

  // Registrar referido
  await supabase.from("referrals").insert({
    referrer_id: referrerId,
    referred_id: newUserId,
    status: "COMPLETED",
  });

  // Guardar quién lo refirió en el perfil
  await supabase
    .from("users")
    .update({ referred_by: referrerId })
    .eq("id", newUserId);

  // Dar S/ 5.00 de saldo a cada uno
  await Promise.all([
    supabase.rpc("add_wallet_balance", { user_id: referrerId, amount: 5.0 }),
    supabase.rpc("add_wallet_balance", { user_id: newUserId, amount: 5.0 }),
  ]);

  return true;
}

export async function getReferralStats(userId: string) {
  const supabase = createClient();

  const { data: referrals, count } = await supabase
    .from("referrals")
    .select("*, referred:referred_id(name)", { count: "exact" })
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  return {
    total: count ?? 0,
    referrals: referrals ?? [],
    earned: (count ?? 0) * 5.0,
  };
}
