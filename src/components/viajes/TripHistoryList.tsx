import { MapPin, Clock, DollarSign, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Trip } from "@/types/trip";

const STATUS_LABELS: Record<string, string> = {
  FINISHED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, "success" | "destructive"> = {
  FINISHED: "success",
  CANCELLED: "destructive",
};

interface TripHistoryListProps {
  trips: Trip[];
  role: "CLIENT" | "DRIVER";
}

export function TripHistoryList({ trips, role }: TripHistoryListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No tienes viajes registrados aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => (
        <Card key={trip.id} className="overflow-hidden">
          <CardContent className="pt-4 pb-4 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Badge variant={STATUS_COLORS[trip.status] ?? "secondary"}>
                {STATUS_LABELS[trip.status] ?? trip.status}
              </Badge>
              <span className="text-xs text-gray-400">
                {new Date(trip.created_at).toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Ruta */}
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 mt-1 shrink-0" />
                <span className="text-gray-600 line-clamp-1">
                  {trip.origin_address ??
                    `${trip.origin_lat.toFixed(5)}, ${trip.origin_lng.toFixed(5)}`}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0" />
                <span className="text-gray-600 line-clamp-1">
                  {trip.destination_address ??
                    `${trip.destination_lat.toFixed(5)}, ${trip.destination_lng.toFixed(5)}`}
                </span>
              </div>
            </div>

            {/* Métricas */}
            <div className="flex items-center gap-4 pt-1">
              {trip.price && (
                <div className="flex items-center gap-1 text-orange-500 font-semibold text-sm">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>S/ {Number(trip.price).toFixed(2)}</span>
                </div>
              )}
              {trip.distance_km && (
                <span className="text-xs text-gray-400">
                  {Number(trip.distance_km).toFixed(1)} km
                </span>
              )}
              {trip.duration_min && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {trip.duration_min} min
                </span>
              )}
              {role === "CLIENT" && trip.rating && (
                <div className="flex items-center gap-0.5 ml-auto">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= trip.rating!
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
