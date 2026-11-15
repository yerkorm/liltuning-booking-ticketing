// Plain row types matching supabase/schema.sql, used for manual annotations
// at call sites. Deliberately NOT wired through supabase-js's generic
// `Database` contract (Tables/Views/Functions/...) — for a schema this size
// that generic dance produces more friction (everything collapsing to
// `never` unless every branch is filled in exactly right) than value.
// Keep in sync manually when the schema changes.

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled"
  | "expired";

export type StaffRole = "staff" | "super_admin";

export interface ServiceRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface StaffUserRow {
  id: string;
  full_name: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
}

export interface AvailabilityRuleRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  active: boolean;
  created_at: string;
}

export interface ClosedDateRow {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  deposit_amount_clp: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  assigned_staff_id: string | null;
  staff_notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEventRow {
  id: number;
  mp_payment_id: string;
  booking_id: string | null;
  ticket_order_id: string | null;
  status: string;
  raw_payload: unknown;
  created_at: string;
}

export interface SiteSettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export type EventStatus = "draft" | "published" | "cancelled";
export type TicketOrderStatus = "pending_payment" | "paid" | "cancelled" | "expired";
export type TicketStatus = "valid" | "used" | "cancelled";

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  status: EventStatus;
  created_at: string;
}

export interface TicketTypeRow {
  id: string;
  event_id: string;
  name: string;
  price_clp: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_order: number;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TicketOrderRow {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  status: TicketOrderStatus;
  total_amount_clp: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketOrderItemRow {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price_clp: number;
}

export interface TicketRow {
  id: string;
  order_id: string;
  ticket_type_id: string;
  event_id: string;
  code: string;
  status: TicketStatus;
  used_at: string | null;
  used_by_staff_id: string | null;
  created_at: string;
}
