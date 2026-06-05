export type PaymentMethod = "CASH" | "CARD" | "YAPE" | "WALLET";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  trip_id: string;
  user_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  external_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  min_trip_price: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export interface CouponValidation {
  valid: boolean;
  coupon: Coupon | null;
  discount: number;
  finalPrice: number;
  error?: string;
}
