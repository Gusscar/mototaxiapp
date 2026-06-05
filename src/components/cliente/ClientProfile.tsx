"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import type { User as UserType } from "@/types/user";

const schema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  phone: z.string().min(9, "Teléfono inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface ClientProfileProps {
  profile: { id: string; name: string; email: string; phone: string | null };
  totalTrips: number;
}

export function ClientProfile({ profile, totalTrips }: ClientProfileProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: profile.name, phone: profile.phone ?? "" },
  });

  async function onSubmit(data: FormData) {
    try {
      setError(null);
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("users")
        .update({ name: data.name, phone: data.phone || null })
        .eq("id", profile.id);
      if (dbError) throw dbError;
      setUser({ ...profile, name: data.name, phone: data.phone || null, role: "CLIENT", photo: null, created_at: "" } as UserType);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{profile.name}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-xs text-orange-500 font-medium mt-0.5">
            {totalTrips} viajes completados
          </p>
        </div>
      </div>

      {/* Formulario edición */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar información</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Teléfono</label>
              <Input {...register("phone")} placeholder="Ej: 987654321" type="tel" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <Input value={profile.email} disabled className="bg-gray-50 text-gray-400" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {saved && <p className="text-sm text-green-600">Cambios guardados</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
