"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  motorcycle_model: z.string().min(3, "Ingresa el modelo de tu moto"),
  license_plate: z
    .string()
    .min(5, "Placa inválida")
    .regex(/^[A-Z0-9-]+$/i, "Solo letras, números y guiones"),
  license_number: z.string().min(5, "Número de licencia inválido"),
});

type FormData = z.infer<typeof schema>;

export function DriverProfileForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (!user) return;
    try {
      setError(null);
      const supabase = createClient();
      const { error: dbError } = await supabase.from("driver_profiles").insert({
        user_id: user.id,
        motorcycle_model: data.motorcycle_model,
        license_plate: data.license_plate.toUpperCase(),
        license_number: data.license_number,
      });
      if (dbError) throw dbError;
      router.push("/conductor");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar perfil");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del vehículo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Modelo de moto
            </label>
            <Input
              placeholder="Ej: Honda CB 125"
              {...register("motorcycle_model")}
            />
            {errors.motorcycle_model && (
              <p className="text-xs text-red-500 mt-1">
                {errors.motorcycle_model.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Placa
            </label>
            <Input
              placeholder="Ej: ABC-123"
              {...register("license_plate")}
              className="uppercase"
            />
            {errors.license_plate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.license_plate.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Número de licencia
            </label>
            <Input
              placeholder="Número de brevete/licencia"
              {...register("license_number")}
            />
            {errors.license_number && (
              <p className="text-xs text-red-500 mt-1">
                {errors.license_number.message}
              </p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            Tu cuenta será revisada por un administrador. Recibirás una notificación cuando sea aprobada.
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Enviar para revisión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
