import { createClient } from "@/lib/supabase/server";
import { CouponManager } from "@/components/admin/CouponManager";
import type { Coupon } from "@/types/payment";

export default async function CuponesPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cupones</h2>
        <p className="text-sm text-gray-500 mt-1">
          Crea y gestiona cupones de descuento para los usuarios.
        </p>
      </div>
      <CouponManager initialCoupons={(coupons ?? []) as Coupon[]} />
    </div>
  );
}
