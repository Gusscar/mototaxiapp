import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_COLORS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  PENDING: "secondary",
  ASSIGNED: "warning",
  ON_ROUTE: "warning",
  STARTED: "default",
  FINISHED: "success",
  CANCELLED: "destructive",
};

export default async function ViajesPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Viajes</h2>
      <div className="grid gap-3">
        {trips?.map((trip) => (
          <Card key={trip.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_COLORS[trip.status] ?? "secondary"}>
                      {trip.status}
                    </Badge>
                    {trip.price && (
                      <span className="font-semibold text-orange-500">
                        S/ {Number(trip.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">
                    {trip.origin_address ?? `${trip.origin_lat}, ${trip.origin_lng}`}
                    {" → "}
                    {trip.destination_address ?? `${trip.destination_lat}, ${trip.destination_lng}`}
                  </p>
                  {trip.distance_km && (
                    <p className="text-xs text-gray-400">
                      {Number(trip.distance_km).toFixed(1)} km
                      {trip.duration_min ? ` · ${trip.duration_min} min` : ""}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(trip.created_at).toLocaleString("es-PE")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!trips || trips.length === 0) && (
          <p className="text-gray-500 text-sm">No hay viajes registrados.</p>
        )}
      </div>
    </div>
  );
}
