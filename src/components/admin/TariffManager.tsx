"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Tariff } from "@/hooks/useTariff";

const schema = z.object({
  base_fare: z.coerce.number().min(0.5, "Mínimo S/ 0.50"),
  per_km: z.coerce.number().min(0, "No puede ser negativo"),
  per_min: z.coerce.number().min(0, "No puede ser negativo"),
  min_fare: z.coerce.number().min(0.5, "Mínimo S/ 0.50"),
  surge_multiplier: z.coerce.number().min(1, "Mínimo 1.0").max(5, "Máximo 5.0"),
  surge_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface TariffManagerProps {
  initialTariffs: Tariff[];
}

export function TariffManager({ initialTariffs }: TariffManagerProps) {
  const router = useRouter();
  const activeTariff = initialTariffs.find((t) => t.is_active) ?? initialTariffs[0];
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: activeTariff
      ? {
          base_fare: activeTariff.base_fare,
          per_km: activeTariff.per_km,
          per_min: activeTariff.per_min,
          min_fare: activeTariff.min_fare,
          surge_multiplier: activeTariff.surge_multiplier,
          surge_active: activeTariff.surge_active,
        }
      : {
          base_fare: 2.0,
          per_km: 1.5,
          per_min: 0.2,
          min_fare: 2.0,
          surge_multiplier: 1.5,
          surge_active: false,
        },
  });

  const surgeActive = watch("surge_active");
  const values = watch();

  // Preview del precio
  const previewDistance = 3; // km
  const previewDuration = 10; // min
  const previewPrice = Math.max(
    values.min_fare ?? 2,
    ((values.base_fare ?? 2) +
      (values.per_km ?? 1.5) * previewDistance +
      (values.per_min ?? 0.2) * previewDuration) *
      (values.surge_active ? (values.surge_multiplier ?? 1) : 1)
  );

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    try {
      if (activeTariff) {
        const { error: dbErr } = await supabase
          .from("tariffs")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", activeTariff.id);
        if (dbErr) throw dbErr;
      } else {
        const { error: dbErr } = await supabase.from("tariffs").insert({ ...data, name: "default" });
        if (dbErr) throw dbErr;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function toggleSurge() {
    if (!activeTariff) return;
    const supabase = createClient();
    const newState = !activeTariff.surge_active;
    await supabase
      .from("tariffs")
      .update({ surge_active: newState, updated_at: new Date().toISOString() })
      .eq("id", activeTariff.id);
    setValue("surge_active", newState);
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Estado de la tarifa activa */}
      <Card className={`border-2 ${surgeActive ? "border-orange-400" : "border-gray-200"}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${surgeActive ? "text-orange-500" : "text-gray-400"}`} />
              <div>
                <p className="font-semibold text-sm">
                  {surgeActive ? "Hora pico activa" : "Tarifa normal"}
                </p>
                <p className="text-xs text-gray-500">
                  {surgeActive
                    ? `Multiplicador ${values.surge_multiplier}x aplicado`
                    : "Sin recargo adicional"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={surgeActive ? "default" : "secondary"}>
                {surgeActive ? "ACTIVO" : "INACTIVO"}
              </Badge>
              <button
                type="button"
                onClick={toggleSurge}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  surgeActive ? "bg-orange-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    surgeActive ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de tarifa */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Configuración de tarifas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Tarifa base (S/)
                </label>
                <Input
                  type="number"
                  step="0.10"
                  {...register("base_fare")}
                />
                {errors.base_fare && (
                  <p className="text-xs text-red-500 mt-1">{errors.base_fare.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Precio por km (S/)
                </label>
                <Input
                  type="number"
                  step="0.10"
                  {...register("per_km")}
                />
                {errors.per_km && (
                  <p className="text-xs text-red-500 mt-1">{errors.per_km.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Precio por minuto (S/)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  {...register("per_min")}
                />
                {errors.per_min && (
                  <p className="text-xs text-red-500 mt-1">{errors.per_min.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Tarifa mínima (S/)
                </label>
                <Input
                  type="number"
                  step="0.50"
                  {...register("min_fare")}
                />
                {errors.min_fare && (
                  <p className="text-xs text-red-500 mt-1">{errors.min_fare.message}</p>
                )}
              </div>
            </div>

            {/* Hora pico */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Multiplicador hora pico (x)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="0.1"
                  className="w-32"
                  {...register("surge_multiplier")}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="surge_active"
                    className="w-4 h-4 accent-orange-500"
                    {...register("surge_active")}
                  />
                  <label htmlFor="surge_active" className="text-sm text-gray-600">
                    Activar ahora
                  </label>
                </div>
              </div>
              {errors.surge_multiplier && (
                <p className="text-xs text-red-500 mt-1">{errors.surge_multiplier.message}</p>
              )}
            </div>

            {/* Preview precio */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-gray-500 text-xs mb-1">
                Ejemplo: viaje de {previewDistance} km, {previewDuration} min
              </p>
              <p className="font-bold text-orange-500 text-lg">
                S/ {previewPrice.toFixed(2)}
              </p>
              {surgeActive && (
                <p className="text-xs text-orange-400">
                  Con recargo de hora pico ({values.surge_multiplier}x)
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {saved && <p className="text-sm text-green-600">Tarifas actualizadas</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar tarifas"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
