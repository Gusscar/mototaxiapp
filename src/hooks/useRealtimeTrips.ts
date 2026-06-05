"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTripStore } from "@/store/tripStore";
import type { Trip } from "@/types/trip";

export function useRealtimeTrips(tripId: string | null) {
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);

  useEffect(() => {
    if (!tripId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          setActiveTrip(payload.new as Trip);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, setActiveTrip]);
}

export function useRealtimePendingTrips(
  onNewTrip: (trip: Trip) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel("pending-trips")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trips",
          filter: "status=eq.PENDING",
        },
        (payload) => {
          onNewTrip(payload.new as Trip);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onNewTrip]);
}
