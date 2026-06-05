"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DriverLocation {
  lat: number;
  lng: number;
}

export function useDriverLocation(driverId: string | null): DriverLocation | null {
  const [location, setLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    if (!driverId) {
      setLocation(null);
      return;
    }

    const supabase = createClient();

    // Obtener ubicación inicial
    supabase
      .from("driver_profiles")
      .select("current_lat, current_lng")
      .eq("user_id", driverId)
      .single()
      .then(({ data }) => {
        if (data?.current_lat && data?.current_lng) {
          setLocation({ lat: Number(data.current_lat), lng: Number(data.current_lng) });
        }
      });

    // Suscribirse a cambios de ubicación
    const channel = supabase
      .channel(`driver-location:${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_profiles",
          filter: `user_id=eq.${driverId}`,
        },
        (payload) => {
          const { current_lat, current_lng } = payload.new as {
            current_lat: number | null;
            current_lng: number | null;
          };
          if (current_lat && current_lng) {
            setLocation({ lat: current_lat, lng: current_lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return location;
}
