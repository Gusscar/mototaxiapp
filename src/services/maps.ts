import type { Location } from "@/types/trip";

interface RouteResult {
  distanceKm: number;
  durationMin: number;
  coordinates: [number, number][];
}

export async function getRoute(
  origin: Location,
  destination: Location
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al calcular la ruta");

  const data = await res.json();
  const route = data.routes[0];

  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.ceil(route.duration / 60),
    coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "es" },
  });
  if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** Precio estático de fallback (sin tarifas dinámicas) */
export function calculatePrice(distanceKm: number): number {
  const BASE_FARE = 2.0;
  const PER_KM = 1.5;
  return Math.max(BASE_FARE, BASE_FARE + distanceKm * PER_KM);
}

export async function searchPlaces(query: string): Promise<{ label: string; lat: number; lng: number }[]> {
  if (query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "es" } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data as Array<{ display_name: string; lat: string; lon: string }>).map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}
