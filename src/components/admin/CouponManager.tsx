"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Coupon } from "@/types/payment";

const schema = z.object({
  code: z.string().min(3, "Mínimo 3 caracteres").max(20).regex(/^[A-Z0-9]+$/i, "Solo letras y números"),
  description: z.string().optional(),
  discount_type: z.enum(["PERCENT", "FIXED"]),
  discount_value: z.coerce.number().min(1, "Mínimo 1"),
  min_trip_price: z.coerce.number().min(0),
  max_uses: z.coerce.number().optional(),
  max_uses_per_user: z.coerce.number().min(1).default(1),
  valid_until: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount_type: "PERCENT", min_trip_price: 0, max_uses_per_user: 1 },
  });

  const discountType = watch("discount_type");

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { data: newCoupon, error: dbErr } = await supabase
      .from("coupons")
      .insert({
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_trip_price: data.min_trip_price,
        max_uses: data.max_uses || null,
        max_uses_per_user: data.max_uses_per_user,
        valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : null,
      })
      .select()
      .single();

    if (dbErr) { setError(dbErr.message); return; }
    setCoupons((prev) => [newCoupon as Coupon, ...prev]);
    reset();
    setShowForm(false);
    router.refresh();
  }

  async function toggleActive(coupon: Coupon) {
    const supabase = createClient();
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
  }

  async function deleteCoupon(id: string) {
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Button onClick={() => setShowForm(!showForm)}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo cupón
      </Button>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Crear cupón</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Código</label>
                  <Input placeholder="PROMO20" className="uppercase" {...register("code")} />
                  {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Descripción</label>
                  <Input placeholder="20% de descuento" {...register("description")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Tipo</label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                    {...register("discount_type")}
                  >
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Fijo (S/)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    {discountType === "PERCENT" ? "Descuento (%)" : "Descuento (S/)"}
                  </label>
                  <Input type="number" step="1" {...register("discount_value")} />
                  {errors.discount_value && <p className="text-xs text-red-500">{errors.discount_value.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Precio mínimo (S/)</label>
                  <Input type="number" step="0.5" {...register("min_trip_price")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Usos totales</label>
                  <Input type="number" placeholder="Sin límite" {...register("max_uses")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Usos por usuario</label>
                  <Input type="number" {...register("max_uses_per_user")} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Válido hasta</label>
                <Input type="datetime-local" {...register("valid_until")} />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear cupón"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de cupones */}
      <div className="space-y-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className={coupon.is_active ? "" : "opacity-60"}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gray-800">{coupon.code}</span>
                    <Badge variant={coupon.is_active ? "success" : "secondary"}>
                      {coupon.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline">
                      {coupon.discount_type === "PERCENT"
                        ? `${coupon.discount_value}% OFF`
                        : `S/ ${coupon.discount_value} OFF`}
                    </Badge>
                  </div>
                  {coupon.description && (
                    <p className="text-xs text-gray-500">{coupon.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Usos: {coupon.uses_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""} ·
                    Min: S/ {coupon.min_trip_price}
                    {coupon.valid_until && ` · Hasta: ${new Date(coupon.valid_until).toLocaleDateString("es-PE")}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(coupon)} className="text-gray-400 hover:text-orange-500">
                    {coupon.is_active
                      ? <ToggleRight className="w-5 h-5 text-orange-500" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteCoupon(coupon.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {coupons.length === 0 && (
          <p className="text-gray-400 text-sm">No hay cupones creados.</p>
        )}
      </div>
    </div>
  );
}
