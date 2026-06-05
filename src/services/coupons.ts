import { createClient } from "@/lib/supabase/client";
import type { Coupon, CouponValidation } from "@/types/payment";

export async function validateCoupon(
  code: string,
  userId: string,
  tripPrice: number
): Promise<CouponValidation> {
  const supabase = createClient();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, coupon: null, discount: 0, finalPrice: tripPrice, error: "Cupón no válido" };
  }

  const c = coupon as Coupon;

  // Verificar vigencia
  const now = new Date();
  if (c.valid_until && new Date(c.valid_until) < now) {
    return { valid: false, coupon: null, discount: 0, finalPrice: tripPrice, error: "Cupón expirado" };
  }
  if (new Date(c.valid_from) > now) {
    return { valid: false, coupon: null, discount: 0, finalPrice: tripPrice, error: "Cupón aún no disponible" };
  }

  // Verificar precio mínimo
  if (tripPrice < c.min_trip_price) {
    return {
      valid: false, coupon: null, discount: 0, finalPrice: tripPrice,
      error: `Precio mínimo del viaje: S/ ${c.min_trip_price.toFixed(2)}`
    };
  }

  // Verificar usos totales
  if (c.max_uses !== null && c.uses_count >= c.max_uses) {
    return { valid: false, coupon: null, discount: 0, finalPrice: tripPrice, error: "Cupón agotado" };
  }

  // Verificar usos por usuario
  const { count } = await supabase
    .from("coupon_usages")
    .select("*", { count: "exact", head: true })
    .eq("coupon_id", c.id)
    .eq("user_id", userId);

  if ((count ?? 0) >= c.max_uses_per_user) {
    return { valid: false, coupon: null, discount: 0, finalPrice: tripPrice, error: "Ya usaste este cupón" };
  }

  // Calcular descuento
  const discount =
    c.discount_type === "PERCENT"
      ? (tripPrice * c.discount_value) / 100
      : Math.min(c.discount_value, tripPrice);

  const finalPrice = Math.max(0, tripPrice - discount);

  return { valid: true, coupon: c, discount, finalPrice };
}

export async function applyCoupon(
  couponId: string,
  userId: string,
  tripId: string,
  discountApplied: number
): Promise<void> {
  const supabase = createClient();

  await Promise.all([
    supabase.from("coupon_usages").insert({
      coupon_id: couponId,
      user_id: userId,
      trip_id: tripId,
      discount_applied: discountApplied,
    }),
    supabase.rpc("increment_coupon_uses", { coupon_id: couponId }),
  ]);
}
