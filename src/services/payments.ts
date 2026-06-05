import { createClient } from "@/lib/supabase/client";
import type { Payment, PaymentMethod } from "@/types/payment";

export async function createPayment(
  tripId: string,
  userId: string,
  amount: number,
  method: PaymentMethod
): Promise<Payment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({ trip_id: tripId, user_id: userId, amount, method, status: "PENDING" })
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function confirmPayment(paymentId: string): Promise<Payment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "COMPLETED", updated_at: new Date().toISOString() })
    .eq("id", paymentId)
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function getPaymentsForUser(userId: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Payment[]) ?? [];
}

// Wallet
export async function getWalletBalance(userId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", userId)
    .single();
  return Number((data as { wallet_balance: number } | null)?.wallet_balance ?? 0);
}

export async function deductFromWallet(userId: string, amount: number): Promise<boolean> {
  const supabase = createClient();
  const balance = await getWalletBalance(userId);
  if (balance < amount) return false;
  await supabase
    .from("users")
    .update({ wallet_balance: balance - amount })
    .eq("id", userId);
  return true;
}
