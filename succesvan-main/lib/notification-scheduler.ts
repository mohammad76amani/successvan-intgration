import Notification from "@/model/notification";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import Office from "@/model/office";
import Vehicle from "@/model/vehicle";
import { customerReservationsSmsUrl, sendSMS } from "@/lib/sms";
import { createLondonDateTime, parseStorageDate } from "@/lib/englandTime";

type NotificationUser = {
  _id: { toString(): string };
  name?: string;
  lastName?: string;
  phoneData?: { phoneNumber?: string };
};

type NotificationOffice = { name?: string };
type NotificationVehicle = {
  title?: string;
  number?: string | number;
  keyNumber?: string;
  color?: string;
};

// The stored startDate/endDate instants can carry the timezone of whoever
// created the reservation (customer device, admin browser), so rebuild the
// real instant from the London-local strings the customer actually picked
// (startDateDisplay/pickupTime, endDateDisplay/returnTime) whenever they exist.
const getReservationInstant = (
  dateDisplay: string | undefined,
  time: string | undefined,
  fallback: Date | string
): Date => {
  const day = parseStorageDate(dateDisplay);
  if (day && time && /^\d{1,2}:\d{2}$/.test(time)) {
    return new Date(createLondonDateTime(day, time));
  }
  return new Date(fallback);
};

const formatLondonTime = (date: Date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });

const formatLondonDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
  });

export async function scheduleReservationNotifications(reservationId: string) {
  const reservation = await Reservation.findById(reservationId)
    .populate({
      path: "user",
      model: User,
      select: "phoneData",
    })
    .populate({
      path: "office",
      model: Office,
    });

  if (!reservation) throw new Error("Reservation not found");

  const user = reservation.user as unknown as NotificationUser;
  const office = reservation.office as unknown as NotificationOffice;
  const phoneNumber = user.phoneData?.phoneNumber;

  if (!phoneNumber) return;

  const startDate = getReservationInstant(
    reservation.startDateDisplay,
    reservation.pickupTime,
    reservation.startDate
  );
  const now = new Date();

  const reminderFor = new Date(startDate.getTime() - 3 * 60 * 60 * 1000);

  if (reminderFor > now) {
    await Notification.create({
      type: "reservation_reminder",
      reservation: reservationId,
      user: user._id,
      phoneNumber,
      message: `Success Van Hire reminder: Your van pickup is on ${formatLondonDate(startDate)} at ${formatLondonTime(startDate)} from ${office.name || "our office"}. Details: ${customerReservationsSmsUrl()}`,
      scheduledFor: reminderFor,
    });
  }
}

export async function rescheduleReturnNotifications(reservationId: string) {
  const reservation = await Reservation.findById(reservationId)
    .populate({
      path: "user",
      model: User,
      select: "phoneData",
    })
    .populate({
      path: "office",
      model: Office,
    });

  if (!reservation) return;

  // Remove reminders for the previous return deadline before creating the
  // replacement schedule. Sent reminders are retained as history.
  await Notification.deleteMany({
    reservation: reservationId,
    status: "pending",
    type: "reservation_reminder",
  });

  const user = reservation.user as unknown as NotificationUser;
  const office = reservation.office as unknown as NotificationOffice;
  const phoneNumber = user.phoneData?.phoneNumber;
  if (!phoneNumber) return;

  const returnAt = getReservationInstant(
    reservation.endDateDisplay,
    reservation.returnTime,
    reservation.endDate,
  );
  const reminderAt = new Date(returnAt.getTime() - 3 * 60 * 60 * 1000);
  const now = new Date();

  if (reminderAt > now) {
    await Notification.create({
      type: "reservation_reminder",
      reservation: reservationId,
      user: user._id,
      phoneNumber,
      message: `Success Van Hire reminder: Please return your van on ${formatLondonDate(returnAt)} at ${formatLondonTime(returnAt)} to ${office?.name || "our office"}. Details: ${customerReservationsSmsUrl()}`,
      scheduledFor: reminderAt,
    });
    console.log(
      `[NOTIF] Created return reminder for ${reservationId} at ${reminderAt}`,
    );
  }
}

export async function sendStatusNotification(
  reservationId: string,
  status: "confirmed" | "canceled" | "delivered"
) {
  const reservation = await Reservation.findById(reservationId)
    .populate("user")
    .populate("office")
    .populate("vehicle");

  if (!reservation) return;

  const user = reservation.user as unknown as NotificationUser;
  const vehicle = reservation.vehicle as unknown as NotificationVehicle;
  const phoneNumber = user.phoneData?.phoneNumber;

  if (!phoneNumber) return;

  const returnAt = getReservationInstant(
    reservation.endDateDisplay,
    reservation.returnTime,
    reservation.endDate
  );

  const vehicleInfo = vehicle?.number ? ` Vehicle: ${vehicle.number}.` : "";
  const cancelReason =
    typeof reservation.cancelReason === "string" &&
    reservation.cancelReason.trim()
      ? `Reason: ${reservation.cancelReason.trim()}`
      : "";

  const messages = {
    confirmed: reservation.perInvoice
      ? `Your booking is confirmed. We’ll prepare your per-invoice agreement for signing: ${customerReservationsSmsUrl()}`
      : `Your booking is confirmed. Please choose your rental fee option and make payment in My Reservations: ${customerReservationsSmsUrl()}`,
    canceled: `Your booking has been cancelled.${cancelReason ? ` ${cancelReason}.` : ""} If you need help, call 020 3011 1198.`,
    delivered: `Handover complete.${vehicleInfo} Return by ${formatLondonDate(returnAt)} at ${formatLondonTime(returnAt)} (UK). Emergency or breakdown: 020 3011 1198. ${customerReservationsSmsUrl()}`,
  };

  // Send SMS immediately, don't save to database
  try {
    await sendSMS(phoneNumber.replace("+", ""), messages[status]);
  } catch (error) {
    console.log(
      `Status SMS Error (${status}):`,
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Delete old pickup reminders and create return reminders when delivered.
  if (status === "delivered") {
    await rescheduleReturnNotifications(reservationId);
  }

  // Cancel pending reminders if canceled
  if (status === "canceled") {
    await Notification.deleteMany({
      reservation: reservationId,
      status: "pending",
      type: "reservation_reminder",
    });
  }
}

export async function sendReservationEditedNotification(reservationId: string) {
  const reservation = await Reservation.findById(reservationId)
    .populate("user")
    .populate("office");

  if (!reservation) return;

  const user = reservation.user as unknown as NotificationUser;
  const phoneNumber = user.phoneData?.phoneNumber;

  if (!phoneNumber) return;

  try {
    await sendSMS(
      phoneNumber.replace("+", ""),
      `Your reservation has been updated by our team. View the latest details: ${customerReservationsSmsUrl()}`
    );
  } catch (error) {
    console.log(
      "Reservation edited SMS Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

type OwnerNotificationUser = {
  _id: { toString(): string };
  phoneData?: { phoneNumber?: string };
};

type RefundNotificationReservation = {
  _id: { toString(): string };
  reservationCode?: string;
  user?: { name?: string; lastName?: string };
  vehicle?: { title?: string; number?: string | number };
  vehicleSnapshot?: { title?: string; number?: string };
  refund?: { refundAmount?: number; expectedBy?: Date };
};

/**
 * Queue one deadline SMS per owner. Existing sent reminders are immutable;
 * pending/failed reminders are safely refreshed when an admin changes the
 * expected refund date.
 */
export async function scheduleRefundDueOwnerNotifications(
  reservationId: string,
) {
  const reservation = (await Reservation.findById(reservationId)
    .populate({ path: "user", model: User, select: "name lastName" })
    .populate({
      path: "vehicle",
      model: Vehicle,
      select: "title number keyNumber color",
    })) as RefundNotificationReservation | null;

  if (!reservation?.refund?.expectedBy) {
    throw new Error("Refund expected date is required before scheduling SMS");
  }

  const owners = (await User.find({
    role: "owner",
    "phoneData.phoneNumber": { $exists: true, $nin: [null, ""] },
  }).select("phoneData")) as OwnerNotificationUser[];

  const customerName = [reservation.user?.name, reservation.user?.lastName]
    .filter(Boolean)
    .join(" ") || "Customer";
  const vehicle = reservation.vehicle || reservation.vehicleSnapshot;
  const vehicleLabel =
    [vehicle?.title, vehicle?.number].filter(Boolean).join(" · ") ||
    "Vehicle not recorded";
  const refundAmount = Number(reservation.refund.refundAmount || 0).toFixed(2);
  const bookingReference =
    reservation.reservationCode || reservation._id.toString();
  const message = `Refund due for ${bookingReference}: ${customerName}, £${refundAmount}, ${vehicleLabel}. Please check the admin dashboard.`;

  for (const owner of owners) {
    const phoneNumber = owner.phoneData?.phoneNumber;
    if (!phoneNumber) continue;

    const dedupeKey = `refund-due:${reservationId}:${owner._id.toString()}`;
    const existing = await Notification.findOne({ dedupeKey }).select(
      "status",
    );
    if (existing?.status === "sent") continue;

    await Notification.updateOne(
      { dedupeKey },
      {
        $set: {
          type: "refund_due_owner",
          reservation: reservationId,
          user: owner._id,
          phoneNumber,
          message,
          scheduledFor: reservation.refund.expectedBy,
          status: "pending",
          attempts: 0,
          claimedAt: null,
          sentAt: null,
          error: null,
        },
      },
      { upsert: true },
    );
  }
}

export async function cancelRefundDueOwnerNotifications(
  reservationId: string,
) {
  await Notification.deleteMany({
    reservation: reservationId,
    type: "refund_due_owner",
    status: { $in: ["pending", "processing", "failed"] },
  });
}
