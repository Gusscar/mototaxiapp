import { createClient } from "@/lib/supabase/client";
import type { Trip, Location } from "@/types/trip";

export async function createTrip(
  clientId: string,
  origin: Location,
  destination: Location,
  price?: number
): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      client_id: clientId,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      origin_address: origin.address,
      destination_address: destination.address,
      price: price ?? null,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function acceptTrip(tripId: string, driverId: string): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ driver_id: driverId, status: "ASSIGNED" })
    .eq("id", tripId)
    .eq("status", "PENDING")
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function updateTripStatus(
  tripId: string,
  status: Trip["status"]
): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function getActiveTripForClient(clientId: string): Promise<Trip | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("trips")
    .select()
    .eq("client_id", clientId)
    .not("status", "in", '("FINISHED","CANCELLED")')
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (data as Trip) ?? null;
}

export async function getPendingTrips(): Promise<Trip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select()
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Trip[]) ?? [];
}
