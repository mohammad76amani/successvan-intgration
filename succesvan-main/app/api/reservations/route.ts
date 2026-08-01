import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import AddOn from "@/model/addOn";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendSMS } from "@/lib/sms";
import { requireAuth, verifyToken } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { formatDateInputInLondon } from "@/lib/englandTime";
import { normalizeReservationStatus } from "@/lib/reservation-status";
import type { PipelineStage } from "mongoose";

type NumberRangeFilter = { $gte?: number; $lte?: number };
type DateRangeFilter = { $gte?: Date; $lte?: Date };
type ReservationFilter = Record<string, unknown> & {
  totalPrice?: NumberRangeFilter;
  startDate?: DateRangeFilter;
  endDate?: DateRangeFilter;
  createdAt?: DateRangeFilter;
};

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    await connect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const reservationCode = searchParams.get("reservationCode");
    const name = searchParams.get("name");
    const user = searchParams.get("user");
    const phone = searchParams.get("phone");
    const category = searchParams.get("category");
    const office = searchParams.get("office");
    const vehicle = searchParams.get("vehicle");
    const totalPriceMin = searchParams.get("totalPriceMin");
    const totalPriceMax = searchParams.get("totalPriceMax");
    const startDateRange = searchParams.get("startDateStart");
    const startDateRangeEnd = searchParams.get("startDateEnd");
    const endDateRange = searchParams.get("endDateStart");
    const endDateRangeEnd = searchParams.get("endDateEnd");
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");
    const reservationType = searchParams.get("reservationType");
    const isManualPrice = searchParams.get("isManualPrice");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const statusNe = searchParams.get("status_ne");
    const history = searchParams.get("history") === "true";
    const refundDue = searchParams.get("refundDue") === "true";
    // ✅ Sort params
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = searchParams.get("sortOrder");
    const sortDirection: 1 | -1 = sortOrderParam === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortDirection };

    const query: ReservationFilter = {};
    if (canAccessDashboard(auth.role)) {
      if (userId) query.user = userId;
    } else {
      query.user = auth.userId;
    }
    if (reservationCode)
      query.reservationCode = { $regex: reservationCode.trim(), $options: "i" };
    if (name) query.user = name;
    if (user) query.user = user;
    if (category) query.category = category;
    if (office) query.office = office;
    if (history) {
      const requestedHistoryStatus = status
        ? normalizeReservationStatus(status)
        : null;
      query.status = requestedHistoryStatus
        ? ["completed", "canceled", "expired"].includes(
            requestedHistoryStatus,
          )
          ? requestedHistoryStatus
          : { $in: [] }
        : { $in: ["completed", "canceled", "expired"] };
    } else if (status) {
      query.status = normalizeReservationStatus(status) ?? status;
    } else if (statusNe) {
      query.status = { $ne: normalizeReservationStatus(statusNe) ?? statusNe };
    }
    if (vehicle) {
      query.$or = [
        { vehicle },
        { "vehicleSnapshot.vehicleId": vehicle },
      ];
    }
    if (refundDue) {
      query.status = "refund_processing";
      query["refund.status"] = { $in: ["approved", "processing"] };
      query["refund.expectedBy"] = { $lte: new Date() };
    }
    if (reservationType) query.reservationType = reservationType;
    if (isManualPrice) query.isManualPrice = isManualPrice === "true";
    if (totalPriceMin || totalPriceMax) {
      const totalPriceRange: NumberRangeFilter = {};
      if (totalPriceMin) totalPriceRange.$gte = parseFloat(totalPriceMin);
      if (totalPriceMax) totalPriceRange.$lte = parseFloat(totalPriceMax);
      query.totalPrice = totalPriceRange;
    }

    if (startDateRange) {
      const [year, month, day] = startDateRange.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const startDateFilter: DateRangeFilter = { $gte: start };
      if (startDateRangeEnd) {
        const [endYear, endMonth, endDay] = startDateRangeEnd.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        startDateFilter.$lte = end;
      }
      query.startDate = startDateFilter;
    }

    if (endDateRange) {
      const [year, month, day] = endDateRange.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endDateFilter: DateRangeFilter = { $gte: start };
      if (endDateRangeEnd) {
        const [endYear, endMonth, endDay] = endDateRangeEnd.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        endDateFilter.$lte = end;
      }
      query.endDate = endDateFilter;
    }

    if (createdAtStart || createdAtEnd) {
      const createdAtFilter: DateRangeFilter = {};
      if (createdAtStart) {
        const [year, month, day] = createdAtStart.split('-').map(Number);
        createdAtFilter.$gte = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      if (createdAtEnd) {
        const [endYear, endMonth, endDay] = createdAtEnd.split('-').map(Number);
        createdAtFilter.$lte = new Date(
          endYear,
          endMonth - 1,
          endDay,
          23,
          59,
          59,
          999,
        );
      }
      query.createdAt = createdAtFilter;
    }

    let reservations;
    let total;

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "");
      const aggregationPipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $match: {
            ...query,
            "user.phoneData.phoneNumber": {
              $regex: normalizedPhone,
              $options: "i",
            },
          },
        },
        {
          $lookup: {
            from: "offices",
            localField: "office",
            foreignField: "_id",
            as: "office",
          },
        },
        { $unwind: { path: "$office", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle",
            foreignField: "_id",
            as: "vehicle",
          },
        },
        { $unwind: { path: "$vehicle", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "addons",
            localField: "addOns.addOn",
            foreignField: "_id",
            as: "addOns.addOn",
          },
        },
        // ✅ از sortObj استفاده می‌کنیم
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limit },
      ];

      reservations = await Reservation.aggregate(aggregationPipeline);

      const countPipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $match: {
            ...query,
            "user.phoneData.phoneNumber": {
              $regex: normalizedPhone,
              $options: "i",
            },
          },
        },
        { $count: "total" },
      ];

      const countResult = await Reservation.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

    } else {
      reservations = await Reservation.find(query)
        .populate("user", "-password")
        .populate("office")
        .populate("category")
        .populate("vehicle")
        .populate({ path: "addOns.addOn", model: AddOn })
        // ✅ از sortObj استفاده می‌کنیم
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      total = await Reservation.countDocuments(query);
    }

    const pages = Math.ceil(total / limit);

    return successResponse({
      data: reservations,
      pagination: { page, limit, total, pages },
    });

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connect();
    const { userData, reservationData } = await req.json();

    // Server-side date validation: the client clock cannot be trusted
    // (users change their device date to book past dates). Admins may
    // back-date reservations from the dashboard.
    let isAdmin = false;
    try {
      isAdmin = verifyToken(req).role === "admin";
    } catch {
      isAdmin = false;
    }

    const startDate = new Date(reservationData?.startDate);
    const endDate = new Date(reservationData?.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return errorResponse("Invalid reservation dates", 400);
    }
    if (endDate.getTime() < startDate.getTime()) {
      return errorResponse("Return date cannot be before pickup date", 400);
    }
    if (!isAdmin) {
      // Compare calendar dates in London time ("YYYY-MM-DD" compares lexicographically)
      const todayLondon = formatDateInputInLondon(new Date());
      const pickupLondon = formatDateInputInLondon(startDate);
      if (pickupLondon < todayLondon) {
        return errorResponse(
          "Pickup date cannot be in the past. Please check that your device's date and time are set correctly.",
          400,
        );
      }
    }

    let user;
    if (userData.userId) {
      user = await User.findById(userData.userId);
    } else {
      user = await User.findOne({
        "phoneData.phoneNumber": userData.phoneNumber,
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.phoneNumber, 10);
        user = await User.create({
          name: userData.name,
          lastName: userData.lastName,
          emaildata: {
            emailAddress: userData.email,
            isVerified: false,
          },
          phoneData: {
            phoneNumber: userData.phoneNumber,
            isVerified: false,
          },
          password: hashedPassword,
        });
      }
    }
    console.log(reservationData, "reserve");

    const submittedDeposit =
      reservationData?.deposit && typeof reservationData.deposit === "object"
        ? reservationData.deposit
        : undefined;

    const reservation = await Reservation.create({
      ...reservationData,
      user: user._id,
      totalPrice: reservationData.totalPrice || 0,
      // Creation never confirms, pays, assigns, or contracts a booking. Those
      // changes belong to the explicit journey actions and their audit trail.
      status: "pending",
      vehicle: undefined,
      vehicleSnapshot: undefined,
      contract: undefined,
      ...(submittedDeposit
        ? {
            deposit: {
              amount: submittedDeposit.amount,
              dueAt: submittedDeposit.dueAt,
              status: "not_paid",
            },
          }
        : {}),
    });

    await reservation.populate([
      { path: "user", select: "-password" },
      { path: "office" },
      // { path: "addOns.addOn" },
    ]);

    const hasLicence =
      user.licenceAttached?.front && user.licenceAttached?.back;
    const licenceMessage = hasLicence ? "" : " Add licence to dashboard.";

    // Send creation SMS
    try {
      await sendSMS(
        user.phoneData.phoneNumber.replace("+", ""),
        `Dear ${user.name}, reservation created, pending review.${licenceMessage} SuccessVanHire.co.uk/register`
      );
    } catch (error) {
      console.log(
        "Creation SMS Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    const admins = await User.find({ role: "owner" });
    for (const admin of admins) {
      try {
        await sendSMS(
          admin.phoneData.phoneNumber,
          "You have a new reservation. Check the admin dashboard."
        );
      } catch (error) {
        console.log(
          `Admin SMS Error (${admin.phoneData.phoneNumber}):`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    return successResponse(reservation, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    await connect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const reservation = await Reservation.findByIdAndDelete(userId);
    if (!reservation) return errorResponse("Reservation not found", 404);
    return successResponse({ message: "Reservation deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
