export type UserRole = "CLIENT" | "DRIVER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  photo: string | null;
  created_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  motorcycle_model: string;
  license_plate: string;
  license_number: string;
  is_approved: boolean;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
}

export interface DriverWithProfile extends User {
  driver_profiles: DriverProfile | null;
}
