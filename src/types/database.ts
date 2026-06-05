export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: "CLIENT" | "DRIVER" | "ADMIN";
          photo: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          role?: "CLIENT" | "DRIVER" | "ADMIN";
          photo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          role?: "CLIENT" | "DRIVER" | "ADMIN";
          photo?: string | null;
          created_at?: string;
        };
      };
      driver_profiles: {
        Row: {
          id: string;
          user_id: string;
          motorcycle_model: string;
          license_plate: string;
          license_number: string;
          is_approved: boolean;
          is_online: boolean;
          current_lat: number | null;
          current_lng: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          motorcycle_model: string;
          license_plate: string;
          license_number: string;
          is_approved?: boolean;
          is_online?: boolean;
          current_lat?: number | null;
          current_lng?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          motorcycle_model?: string;
          license_plate?: string;
          license_number?: string;
          is_approved?: boolean;
          is_online?: boolean;
          current_lat?: number | null;
          current_lng?: number | null;
        };
      };
      trips: {
        Row: {
          id: string;
          client_id: string;
          driver_id: string | null;
          origin_lat: number;
          origin_lng: number;
          destination_lat: number;
          destination_lng: number;
          origin_address: string | null;
          destination_address: string | null;
          status: "PENDING" | "ASSIGNED" | "ON_ROUTE" | "STARTED" | "FINISHED" | "CANCELLED";
          price: number | null;
          distance_km: number | null;
          duration_min: number | null;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          driver_id?: string | null;
          origin_lat: number;
          origin_lng: number;
          destination_lat: number;
          destination_lng: number;
          origin_address?: string | null;
          destination_address?: string | null;
          status?: "PENDING" | "ASSIGNED" | "ON_ROUTE" | "STARTED" | "FINISHED" | "CANCELLED";
          price?: number | null;
          distance_km?: number | null;
          duration_min?: number | null;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          driver_id?: string | null;
          origin_lat?: number;
          origin_lng?: number;
          destination_lat?: number;
          destination_lng?: number;
          origin_address?: string | null;
          destination_address?: string | null;
          status?: "PENDING" | "ASSIGNED" | "ON_ROUTE" | "STARTED" | "FINISHED" | "CANCELLED";
          price?: number | null;
          distance_km?: number | null;
          duration_min?: number | null;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
