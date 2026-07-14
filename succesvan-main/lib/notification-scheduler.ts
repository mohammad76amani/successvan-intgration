import Notification from "@/model/notification";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import Office from "@/model/office";
import { sendSMS } from "@/lib/sms";
import { createLondonDateTime, parseStorageDate } from "@/lib/englandTime";

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

  const user = reservation.user as any;
  const office = reservation.office as any;
  const phoneNumber = user.phoneData?.phoneNumber;

  if (!phoneNumber) return;

  const startDate = getReservationInstant(
    reservation.startDateDisplay,
    reservation.pickupTime,
    reservation.startDate
  );
  const now = new Date();

  // Schedule reminders for all pickup times within 3 hours (every 15 min)
  const pickupTimes = [
    startDate,
    new Date(startDate.getTime() + 15 * 60 * 1000),
    new Date(startDate.getTime() + 30 * 60 * 1000),
    new Date(startDate.getTime() + 45 * 60 * 1000),
  ];

  for (const pickupTime of pickupTimes) {
    const reminderFor = new Date(pickupTime.getTime() - 3 * 60 * 60 * 1000);
    
    if (reminderFor > now) {
      await Notification.create({
        type: "reservation_reminder",
        reservation: reservationId,
        user: user._id,
        phoneNumber,
        message: `Reminder: Van pickup in 3hrs at ${office.name}. Time: ${formatLondonTime(pickupTime)} ${formatLondonDate(pickupTime)}. SuccessVanHire.co.uk`,
        scheduledFor: reminderFor,
      });
    }
  }
}

export async function sendStatusNotification(
  reservationId: string,
  status: "confirmed" | "canceled" | "delivered" | "completed"
) {
  const reservation = await Reservation.findById(reservationId)
    .populate("user")
    .populate("office")
    .populate("vehicle");

  if (!reservation) return;

  const user = reservation.user as any;
  const office = reservation.office as any;
  const vehicle = reservation.vehicle as any;
  const phoneNumber = user.phoneData?.phoneNumber;

  if (!phoneNumber) return;

  const pickupAt = getReservationInstant(
    reservation.startDateDisplay,
    reservation.pickupTime,
    reservation.startDate
  );
  const returnAt = getReservationInstant(
    reservation.endDateDisplay,
    reservation.returnTime,
    reservation.endDate
  );

  const vehicleInfo = vehicle?.number ? ` Vehicle number: ${vehicle.number}` : "";
  const cancelReason =
    typeof reservation.cancelReason === "string" &&
    reservation.cancelReason.trim()
      ? `Reason: ${reservation.cancelReason.trim()}`
      : "";

  const messages = {
    confirmed: `Reservation confirmed! \nPickup: ${formatLondonDate(pickupAt)}, ${formatLondonTime(pickupAt)} at ${office.name}.\nhttps://successvanhire.com/customerDashboard`,
    canceled: `Reservation canceled.\n${cancelReason?`${cancelReason}\n`: ""}For more information call:\n+44 20 3011 1198`,
    delivered: `Vehicle delivered!\n${vehicleInfo}Return by ${formatLondonDate(returnAt)}, ${formatLondonTime(returnAt)}.\nFor emergency or breakdown call +44 20 3011 1198.\n https://successvanhire.com `,
    completed: `Thanks for hiring with Success Van Hire!\nYour licence documents have now been securely removed from our system.\nWe hope everything went smoothly. If so, we'd love to hear about your experience.Your review helps other customers choose a trusted local van hire company.\nhttps://g.page/r/CZcNuTEcLJMAEBM/review`
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

  // Delete old pickup reminders and create return reminders when delivered
  if (status === "delivered") {
    await Notification.deleteMany({
      reservation: reservationId,
      status: "pending",
      type: "reservation_reminder",
    });

    // Create return reminders (3 hours before endDate)
    const endDate = returnAt;
    const now = new Date();
    const returnTimes = [
      endDate,
      new Date(endDate.getTime() + 15 * 60 * 1000),
      new Date(endDate.getTime() + 30 * 60 * 1000),
      new Date(endDate.getTime() + 45 * 60 * 1000),
    ];

    for (const returnTime of returnTimes) {
      const reminderFor = new Date(returnTime.getTime() - 3 * 60 * 60 * 1000);
      if (reminderFor > now) {
        await Notification.create({
          type: "reservation_reminder",
          reservation: reservationId,
          user: user._id,
          phoneNumber,
          message: `Reminder: Van return in 3hrs at ${office?.name || 'office'}. Time: ${formatLondonTime(returnTime)} ${formatLondonDate(returnTime)}. SuccessVanHire.co.uk`,
          scheduledFor: reminderFor,
        });
        console.log(`[NOTIF] Created return reminder for ${reservationId} at ${reminderFor}`);
      }
    }
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

  const user = reservation.user as any;
  const phoneNumber = user.phoneData?.phoneNumber;

  if (!phoneNumber) return;

  try {
    await sendSMS(
      phoneNumber.replace("+", ""),
      `Your reservation updated by admin. Check details in dashboard. SuccessVanHire.co.uk`
    );
  } catch (error) {
    console.log(
      "Reservation edited SMS Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
