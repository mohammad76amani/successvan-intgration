// Shared reservation status definitions used by the model, the API routes,
// and both dashboards. Keep this file dependency-free so it can be imported
// from server and client code alike.

// Ordered booking journey. Index = progression order.
// "pending" and "delivered" are legacy stored values kept for backward
// compatibility with existing reservations (pending = Pending Review,
// delivered = Rental Active).
export const RESERVATION_JOURNEY_STATUSES = [
  "pending", // Pending Review
  "confirmed", // Booking Confirmed
  "deposit_pending", // Deposit Payment requested
  "deposit_paid", // Deposit received
  "contract_pending", // Contract awaiting signature
  "contract_signed", // Contract signed
  "ready_for_collection", // Van ready at the office
  "handover_in_progress", // Vehicle Handover
  "delivered", // Rental Active (vehicle collected)
  "vehicle_returned", // Vehicle Returned
  "return_inspection", // Return Inspection
  "deposit_review", // Deposit Review
  "refund_processing", // Refund Processing
  "refund_completed", // Refund Completed
  "completed", // Complete
] as const;

// Terminal problem states (outside the happy path).
export const RESERVATION_PROBLEM_STATUSES = [
  "canceled",
  "expired",
] as const;

export const RESERVATION_STATUSES = [
  ...RESERVATION_JOURNEY_STATUSES,
  ...RESERVATION_PROBLEM_STATUSES,
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// Alternative spellings accepted from clients, mapped to stored values.
export const RESERVATION_STATUS_ALIASES: Record<string, ReservationStatus> = {
  pending_review: "pending",
  rental_active: "delivered",
  collected: "delivered",
  cancelled: "canceled",
};

export function normalizeReservationStatus(
  value: unknown,
): ReservationStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toLowerCase();
  if ((RESERVATION_STATUSES as readonly string[]).includes(status)) {
    return status as ReservationStatus;
  }
  return RESERVATION_STATUS_ALIASES[status] ?? null;
}

// Progression index within the journey; problem statuses return -1.
export function reservationStatusOrder(status: ReservationStatus): number {
  return (RESERVATION_JOURNEY_STATUSES as readonly string[]).indexOf(status);
}

export function isProblemStatus(status: ReservationStatus): boolean {
  return (RESERVATION_PROBLEM_STATUSES as readonly string[]).includes(status);
}

export function isTerminalStatus(status: ReservationStatus): boolean {
  return status === "completed" || isProblemStatus(status);
}

// Statuses before the customer has the vehicle (upcoming pickups).
export const PRE_PICKUP_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "deposit_pending",
  "deposit_paid",
  "contract_pending",
  "contract_signed",
  "ready_for_collection",
  "handover_in_progress",
];

// Statuses where the customer currently has the vehicle.
export const ON_RENT_STATUSES: ReservationStatus[] = ["delivered"];

// Statuses after the vehicle came back but before the booking closed.
export const POST_RETURN_STATUSES: ReservationStatus[] = [
  "vehicle_returned",
  "return_inspection",
  "deposit_review",
  "refund_processing",
  "refund_completed",
];

// Statuses that still block a time slot / vehicle for availability checks.
export const SLOT_BLOCKING_STATUSES: ReservationStatus[] = [
  ...PRE_PICKUP_STATUSES,
  ...ON_RENT_STATUSES,
];

// Customers may only cancel while the booking is under review.
export const CUSTOMER_CANCELABLE_STATUSES: ReservationStatus[] = ["pending"];

// Map journey statuses onto the four legacy SMS notifications.
// Statuses not listed here don't trigger an SMS.
export const NOTIFIABLE_STATUS_MAP: Partial<
  Record<ReservationStatus, "confirmed" | "canceled" | "delivered" | "completed">
> = {
  confirmed: "confirmed",
  canceled: "canceled",
  delivered: "delivered",
  completed: "completed",
};

// Simplified public journey shown to customers.
export const PUBLIC_JOURNEY_STEPS = [
  "submitted",
  "confirmed",
  "deposit",
  "contract",
  "collection",
  "active_rental",
  "return",
  "refund",
  "complete",
] as const;

export type PublicJourneyStep = (typeof PUBLIC_JOURNEY_STEPS)[number];

export const STATUS_TO_PUBLIC_STEP: Record<ReservationStatus, PublicJourneyStep> =
  {
    pending: "submitted",
    confirmed: "confirmed",
    deposit_pending: "deposit",
    deposit_paid: "deposit",
    contract_pending: "contract",
    contract_signed: "contract",
    ready_for_collection: "collection",
    handover_in_progress: "collection",
    delivered: "active_rental",
    vehicle_returned: "return",
    return_inspection: "return",
    deposit_review: "refund",
    refund_processing: "refund",
    refund_completed: "refund",
    completed: "complete",
    canceled: "submitted",
    expired: "submitted",
  };

export const PUBLIC_STEP_LABELS: Record<PublicJourneyStep, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  deposit: "Deposit",
  contract: "Contract",
  collection: "Collection",
  active_rental: "Active Rental",
  return: "Return",
  refund: "Refund",
  complete: "Complete",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pending Review",
  confirmed: "Booking Confirmed",
  deposit_pending: "Deposit Payment",
  deposit_paid: "Deposit Paid",
  contract_pending: "Contract Signing",
  contract_signed: "Contract Signed",
  ready_for_collection: "Ready for Collection",
  handover_in_progress: "Vehicle Handover",
  delivered: "Rental Active",
  vehicle_returned: "Vehicle Returned",
  return_inspection: "Return Inspection",
  deposit_review: "Deposit Review",
  refund_processing: "Refund Processing",
  refund_completed: "Refund Completed",
  completed: "Complete",
  canceled: "Canceled",
  expired: "Expired",
};

// Tailwind badge classes per status, shared by the admin and customer
// dashboards so every table/modal renders statuses consistently.
export const RESERVATION_STATUS_BADGE_CLASSES: Record<ReservationStatus, string> =
  {
    pending: "bg-yellow-500/20 text-yellow-400",
    confirmed: "bg-green-500/20 text-green-400",
    deposit_pending: "bg-orange-500/20 text-orange-400",
    deposit_paid: "bg-teal-500/20 text-teal-400",
    contract_pending: "bg-orange-500/20 text-orange-400",
    contract_signed: "bg-teal-500/20 text-teal-400",
    ready_for_collection: "bg-cyan-500/20 text-cyan-400",
    handover_in_progress: "bg-purple-500/20 text-purple-400",
    delivered: "bg-purple-500/20 text-purple-400",
    vehicle_returned: "bg-sky-500/20 text-sky-400",
    return_inspection: "bg-sky-500/20 text-sky-400",
    deposit_review: "bg-indigo-500/20 text-indigo-400",
    refund_processing: "bg-indigo-500/20 text-indigo-400",
    refund_completed: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-blue-500/20 text-blue-400",
    canceled: "bg-red-500/20 text-red-400",
    expired: "bg-gray-500/20 text-gray-400",
  };

// Admin panel labels: "delivered" has always been shown as "Collected" there.
export const ADMIN_STATUS_LABELS: Record<ReservationStatus, string> = {
  ...RESERVATION_STATUS_LABELS,
  delivered: "Collected",
};

// Ready-made options for admin selects/filters.
export const ADMIN_STATUS_OPTIONS = RESERVATION_STATUSES.map((status) => ({
  _id: status,
  name: ADMIN_STATUS_LABELS[status],
}));

export function statusBadgeClasses(value: string): string {
  const status = normalizeReservationStatus(value);
  return status
    ? RESERVATION_STATUS_BADGE_CLASSES[status]
    : "bg-gray-500/20 text-gray-400";
}

export function statusLabel(value: string, admin = false): string {
  const status = normalizeReservationStatus(value);
  if (!status) return value || "-";
  return admin ? ADMIN_STATUS_LABELS[status] : RESERVATION_STATUS_LABELS[status];
}

// Deposit lifecycle stored on the reservation.
export const DEPOSIT_STATUSES = [
  "not_paid",
  "pending",
  "paid",
  "failed",
  "held",
  "refund_processing",
  "refunded",
  "partially_refunded",
] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

// How the customer covers the deposit (rules configured per category).
export const DEPOSIT_OPTIONS = ["full", "secure", "office"] as const;
export type DepositOption = (typeof DEPOSIT_OPTIONS)[number];

export const DEPOSIT_OPTION_LABELS: Record<DepositOption, string> = {
  full: "Full deposit (bank transfer)",
  secure: "Safe & secure deposit",
  office: "Pay at office",
};

// Refund lifecycle stored on the reservation.
export const REFUND_STATUSES = [
  "not_started",
  "under_review",
  "approved",
  "processing",
  "completed",
  "failed",
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];
