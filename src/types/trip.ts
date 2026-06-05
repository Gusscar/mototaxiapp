export type TripStatus =
  | "PENDING"
  | "ASSIGNED"
  | "ON_ROUTE"
  | "STARTED"
  | "FINISHED"
  | "CANCELLED";

export interface Trip {
  id: string;
  client_id: string;
  driver_id: string | null;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  origin_address: string | null;
  destination_address: string | null;
  status: TripStatus;
  price: number | null;
  distance_km: number | null;
  duration_min: number | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface TripWithUsers extends Trip {
  client: {
    name: string;
    phone: string | null;
    photo: string | null;
  };
  driver: {
    name: string;
    phone: string | null;
    photo: string | null;
  } | null;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}
