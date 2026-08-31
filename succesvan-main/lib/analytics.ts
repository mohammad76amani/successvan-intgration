const RESERVATION_ORIGIN_KEY = "reservation_origin_page";
const RESERVATION_FLOW_ACTIVE_KEY = "reservation_flow_active";
const completedReservations = new Set<string>();

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const browserPath = () =>
  typeof window === "undefined"
    ? ""
    : `${window.location.pathname}${window.location.search}`;

const pushDataLayer = (event: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
};

const readSession = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSession = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Analytics storage must never interrupt the reservation flow.
  }
};

const removeSession = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Analytics storage must never interrupt the reservation flow.
  }
};

const cleanId = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const id = value.trim();
  return id || undefined;
};

export function getStoredAuthenticatedUserId() {
  if (typeof window === "undefined") return undefined;
  try {
    const storedUser = JSON.parse(window.localStorage.getItem("user") || "null");
    return cleanId(storedUser?._id || storedUser?.id);
  } catch {
    return undefined;
  }
}

export function trackUserIdentified(userId: unknown) {
  const id = cleanId(userId);
  if (!id) return;
  pushDataLayer({ event: "user_identified", user_id: id });
}

export function startReservationFlow(forceNew = false) {
  if (typeof window === "undefined") return;
  if (forceNew || readSession(RESERVATION_FLOW_ACTIVE_KEY) !== "1") {
    writeSession(RESERVATION_ORIGIN_KEY, browserPath());
    writeSession(RESERVATION_FLOW_ACTIVE_KEY, "1");
  }
}

export function cancelReservationFlow() {
  removeSession(RESERVATION_FLOW_ACTIVE_KEY);
  removeSession(RESERVATION_ORIGIN_KEY);
}

export function getReservationOriginPage() {
  return readSession(RESERVATION_ORIGIN_KEY) || browserPath();
}

export function trackReservationConfirmAttempt(userId?: unknown) {
  pushDataLayer({
    event: "reservation_confirm_attempt",
    reservation_origin_page: getReservationOriginPage(),
    user_id: cleanId(userId) || getStoredAuthenticatedUserId(),
  });
}

type ReservationCompletedInput = {
  reservationId: unknown;
  totalPrice: unknown;
  vehicleName?: string;
  vehicleType?: string;
  office?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  pickupTime?: string;
  returnTime?: string;
  userId?: unknown;
};

export function trackReservationCompleted(input: ReservationCompletedInput) {
  const reservationId = cleanId(input.reservationId);
  const value = Number(input.totalPrice);
  if (!reservationId || !Number.isFinite(value)) return false;

  const trackingKey = `ga4_purchase_${reservationId}`;
  if (
    completedReservations.has(reservationId) ||
    readSession(trackingKey) === "1"
  ) {
    return false;
  }

  const originPage = getReservationOriginPage();
  completedReservations.add(reservationId);
  writeSession(trackingKey, "1");
  pushDataLayer({
    event: "reservation_completed",
    transaction_id: reservationId,
    value,
    currency: "GBP",
    reservation_origin_page: originPage,
    completion_page: browserPath(),
    vehicle_name: input.vehicleName || "",
    vehicle_type: input.vehicleType || "",
    office: input.office || "",
    rental_start_date: input.rentalStartDate || "",
    rental_end_date: input.rentalEndDate || "",
    pickup_time: input.pickupTime || "",
    return_time: input.returnTime || "",
    user_id: cleanId(input.userId) || getStoredAuthenticatedUserId(),
  });
  removeSession(RESERVATION_FLOW_ACTIVE_KEY);
  return true;
}

