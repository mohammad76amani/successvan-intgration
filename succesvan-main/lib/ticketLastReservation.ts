import Reservation from "@/model/reservation";
import "@/model/category";
import "@/model/office";
import "@/model/vehicle";

type TicketWithUser = {
  userId?: unknown;
};

const LAST_RESERVATION_FIELDS = [
  "_id",
  "reservationCode",
  "user",
  "office",
  "category",
  "vehicle",
  "startDate",
  "endDate",
  "startDateDisplay",
  "endDateDisplay",
  "pickupTime",
  "returnTime",
  "totalPrice",
  "status",
  "selectedGear",
  "reservationType",
  "createdAt",
  "updatedAt",
].join(" ");

const getTicketUserId = (ticket: TicketWithUser) => {
  const userId = ticket.userId as { _id?: { toString: () => string } } | string;

  if (typeof userId === "string") return userId;
  return userId?._id?.toString() || null;
};

export async function withLastReservations<T>(
  tickets: T[],
) {
  const userIds = Array.from(
    new Set(
      tickets
        .map((ticket) => getTicketUserId(ticket as TicketWithUser))
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  if (userIds.length === 0) {
    return tickets.map((ticket) => ({ ...ticket, lastReservation: null }));
  }

  const reservations = await Reservation.find({ user: { $in: userIds } })
    .select(LAST_RESERVATION_FIELDS)
    .populate("office", "name address")
    .populate("category", "name")
    .populate("vehicle", "title number keyNumber")
    .sort({ createdAt: -1 })
    .lean();

  const lastReservationByUser = new Map<string, unknown>();

  for (const reservation of reservations) {
    const userId = reservation.user?.toString();
    if (userId && !lastReservationByUser.has(userId)) {
      lastReservationByUser.set(userId, reservation);
    }
  }

  return tickets.map((ticket) => {
    const userId = getTicketUserId(ticket as TicketWithUser);
    return {
      ...ticket,
      lastReservation: userId
        ? lastReservationByUser.get(userId) || null
        : null,
    };
  });
}
