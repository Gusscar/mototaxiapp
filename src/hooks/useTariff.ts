"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Tariff {
  id: string;
  name: string;
  base_fare: number;
  per_km: number;
  per_min: number;
  surge_multiplier: number;
  surge_active: boolean;
  min_fare: number;
  is_active: boolean;
}

async function fetchActiveTariff(): Promise<Tariff> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tariffs")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback con valores por defecto
    return {
      id: "default",
      name: "default",
      base_fare: 2.0,
      per_km: 1.5,
      per_min: 0.2,
      surge_multiplier: 1.0,
      surge_active: false,
      min_fare: 2.0,
      is_active: true,
    };
  }

  return data as Tariff;
}

export function useTariff() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tariff"],
    queryFn: fetchActiveTariff,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Suscribirse a cambios en tiempo real de tarifas
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("tariffs-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tariffs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tariff"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function calculateDynamicPrice(
  tariff: Tariff,
  distanceKm: number,
  durationMin: number
): number {
  const multiplier = tariff.surge_active ? tariff.surge_multiplier : 1.0;
  const price =
    (tariff.base_fare + tariff.per_km * distanceKm + tariff.per_min * durationMin) *
    multiplier;
  return Math.max(tariff.min_fare, Math.round(price * 10) / 10);
}
