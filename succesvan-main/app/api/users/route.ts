import { NextRequest } from "next/server";
import connect from "@/lib/data";
import User from "@/model/user";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const roleOptions = [
  "user",
  "admin",
  "owner",
  "Secretary",
  "Consultant",
  "Accountant",
] as const;

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function GET(req: NextRequest) {
  try {
    // ✅ Validate authentication token
    const auth = requireAuth(req);

    // ✅ Check if user can access the management dashboard
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Unauthorized: Dashboard access required", 403);
    }

    await connect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search")?.trim();
    const username = searchParams.get("username");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const roles = (searchParams.get("roles") || "")
      .split(",")
      .map((role) => role.trim())
      .filter((role): role is (typeof roleOptions)[number] =>
        roleOptions.includes(role as (typeof roleOptions)[number]),
      );
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");

    // ✅ پارامترهای جدید سورت
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    if (roles.length > 0) {
      andConditions.push({ role: { $in: roles } });
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      const digitSearch = search.replace(/\D/g, "");
      const searchConditions: Record<string, unknown>[] = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { lastName: { $regex: escapedSearch, $options: "i" } },
        { "emaildata.emailAddress": { $regex: escapedSearch, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$name", " ", "$lastName"] },
              regex: escapedSearch,
              options: "i",
            },
          },
        },
      ];

      if (digitSearch) {
        searchConditions.push({
          "phoneData.phoneNumber": {
            $regex: escapeRegex(digitSearch),
            $options: "i",
          },
        });
      }

      andConditions.push({ $or: searchConditions });
    }

    if (username) {
      const escapedUsername = escapeRegex(username);
      andConditions.push({
        $or: [
          { name: { $regex: escapedUsername, $options: "i" } },
          { lastName: { $regex: escapedUsername, $options: "i" } },
        ],
      });
    }
    if (email) {
      andConditions.push({
        "emaildata.emailAddress": {
          $regex: escapeRegex(email),
          $options: "i",
        },
      });
    }
    if (phone) {
      andConditions.push({
        "phoneData.phoneNumber": {
          $regex: escapeRegex(phone),
          $options: "i",
        },
      });
    }

    // ✅ اصلاح لاجیک تاریخ (بدون مشکل Timezone)
    if (createdAtStart || createdAtEnd) {
      const createdAtQuery: Record<string, Date> = {};
      if (createdAtStart) {
        const [y, m, d] = createdAtStart.split("-").map(Number);
        createdAtQuery.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (createdAtEnd) {
        const [y, m, d] = createdAtEnd.split("-").map(Number);
        createdAtQuery.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
      andConditions.push({ createdAt: createdAtQuery });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const users = await User.find(query)
      .sort(sortObj) // ✅ سورت داینامیک جایگزین شد
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return successResponse({
      data: users,
      pagination: { page, limit, total, pages },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = message === "Unauthorized" ? 401 : 500;
    return errorResponse(message, statusCode);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Unauthorized: Dashboard access required", 403);
    }

    await connect();
    const body = await req.json();

    const name = normalizeString(body.name);
    const lastName = normalizeString(body.lastName);
    const phoneNumber =
      normalizeString(body.phone) ||
      normalizeString(body.phoneNumber) ||
      normalizeString(body.phoneData?.phoneNumber);
    const emailAddress =
      normalizeString(body.email) ||
      normalizeString(body.emailAddress) ||
      normalizeString(body.emaildata?.emailAddress);
    const address = normalizeString(body.address);
    const postalCode = normalizeString(body.postalCode);
    const city = normalizeString(body.city);
    const avatar = normalizeString(body.avatar);
    const licenceFront =
      normalizeString(body.licenceAttached?.front) ||
      normalizeString(body.licenceFront);
    const licenceBack =
      normalizeString(body.licenceAttached?.back) ||
      normalizeString(body.licenceBack);
    const role = roleOptions.includes(body.role) ? body.role : "user";

    if (!name || !lastName || !phoneNumber) {
      return errorResponse("Name, last name, and phone are required", 400);
    }

    const existingPhoneUser = await User.findOne({
      "phoneData.phoneNumber": phoneNumber,
    }).lean();
    if (existingPhoneUser) {
      return errorResponse("Phone number already exists", 409);
    }

    const finalEmailAddress =
      emailAddress ||
      `admin-created-${phoneNumber.replace(/\D/g, "") || Date.now()}@successvan.local`;

    const existingEmailUser = await User.findOne({
      "emaildata.emailAddress": finalEmailAddress,
    }).lean();
    if (existingEmailUser) {
      return errorResponse("Email already exists", 409);
    }

    const userData: Record<string, unknown> = {
      name,
      lastName,
      address,
      postalCode,
      city,
      role,
      emaildata: {
        emailAddress: finalEmailAddress,
        isVerified: false,
      },
      phoneData: {
        phoneNumber,
        isVerified: true,
      },
      licenceAttached: {
        front: licenceFront,
        back: licenceBack,
      },
    };

    if (avatar) {
      userData.avatar = avatar;
    }

    const user = await User.create(userData);

    return successResponse(user, 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return errorResponse(
        "A user with this phone or email already exists",
        409,
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = message === "Unauthorized" ? 401 : 500;
    return errorResponse(message, statusCode);
  }
}
