/**
 * Customers Report Builder
 * Reusable function for generating customer behavior and retention stats
 */

import connect from "@/lib/data";
import User from "@/model/user";
import Reservation from "@/model/reservation";

export interface CustomerReportResult {
  data: Array<{
    _id: string;
    name: string;
    reservationCount: number;
    totalPrice: number;
    createdAt: Date;
  }>;
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    avgReservationsPerCustomer: number;
    newUsersThisMonth: number;
    usersThisMonth: number;
    mostReserved: any;
    leastReserved: any;
  };
}

export async function buildCustomersReport(): Promise<CustomerReportResult> {
  await connect();

  const users = await User.find().lean();
  const reservations = await Reservation.find()
    .populate("user", "_id")
    .lean();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const customerStats = users.map((user: any) => {
    const userReservations = reservations.filter(
      (res: any) => res.user?._id?.toString() === user._id?.toString()
    );
    const totalPrice = userReservations.reduce(
      (sum: number, res: any) => sum + (res.totalPrice || 0),
      0
    );

    return {
      _id: user._id,
      name: `${user.name} ${user.lastName}`,
      reservationCount: userReservations.length,
      totalPrice,
      createdAt: user.createdAt,
    };
  });

  const newUsersThisMonth = users.filter((user: any) => {
    const userDate = new Date(user.createdAt);
    return userDate >= monthStart && userDate <= monthEnd;
  }).length;

  const usersThisMonth = new Set(
    reservations
      .filter((res: any) => {
        const resDate = new Date(res.createdAt || res.startDate);
        return resDate >= monthStart && resDate <= monthEnd;
      })
      .map((res: any) => res.user?._id?.toString())
  ).size;

  const sortedByReservations = [...customerStats].sort(
    (a: any, b: any) => b.reservationCount - a.reservationCount
  );

  return {
    data: customerStats.sort((a: any, b: any) => b.totalPrice - a.totalPrice),
    summary: {
      totalCustomers: users.length,
      totalRevenue: customerStats.reduce(
        (sum: number, c: any) => sum + c.totalPrice,
        0
      ),
      avgReservationsPerCustomer:
        users.length > 0
          ? customerStats.reduce(
              (sum: number, c: any) => sum + c.reservationCount,
              0
            ) / users.length
          : 0,
      newUsersThisMonth,
      usersThisMonth,
      mostReserved: sortedByReservations[0] || null,
      leastReserved: sortedByReservations[sortedByReservations.length - 1] || null,
    },
  };
}
