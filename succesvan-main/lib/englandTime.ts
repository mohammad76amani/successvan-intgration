// *** زمان قابل اعتماد سرور: کاربران ساعت دستگاه را عوض می‌کنند تا تاریخ گذشته رزرو کنند ***
// Offset between the trusted server clock and the device clock (ms).
// 0 on the server itself; on the client it is set by syncServerClock().
let serverClockOffsetMs = 0;
let syncPromise: Promise<number> | null = null;

export const getServerClockOffset = (): number => serverClockOffsetMs;

// Current time based on the server clock (device clock + measured offset).
export const getTrustedNow = (): Date =>
  new Date(Date.now() + serverClockOffsetMs);

// Fetches /api/time once per page load (shared promise) and stores the offset.
// Pass force=true to re-measure (e.g. after the user fixes their clock).
// Returns the measured offset in ms. Throws if the request fails.
export const syncServerClock = async (force = false): Promise<number> => {
  if (typeof window === "undefined") return 0;
  if (force) syncPromise = null;
  if (!syncPromise) {
    syncPromise = (async () => {
      const requestStart = Date.now();
      const res = await fetch("/api/time", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch server time");
      const data = await res.json();
      const requestEnd = Date.now();
      // Estimate the device clock at the moment the server produced its timestamp
      const midpoint = requestStart + (requestEnd - requestStart) / 2;
      serverClockOffsetMs = data.timestamp - midpoint;
      return serverClockOffsetMs;
    })().catch((err) => {
      // Allow retrying after a failed sync
      syncPromise = null;
      throw err;
    });
  }
  return syncPromise;
};

// *** تغییر: تابع برای محاسبه زمان فعلی در انگلیس ***
// جایگزین کامل این تابع
export const getLondonTime = (): Date => {
  // زمان فعلی بر اساس ساعت سرور (نه ساعت دستگاه کاربر)
  const now = getTrustedNow();

  // رشته زمانی لندن را با فرمت قابل parse بگیریم (en-US برای MM/DD/YYYY)
  const londonStr = now.toLocaleString("en-US", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const [datePart, timePart] = londonStr.split(", ");
  if (!datePart || !timePart) {
    console.log("Failed to split London time string");
    return getTrustedNow(); // fallback
  }

  const [monthStr, dayStr, yearStr] = datePart.split("/");
  const [hourStr, minuteStr, secondStr] = timePart.split(":");

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS ماه از 0 شروع می‌شود
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const second = parseInt(secondStr, 10);

  // ساخت Date با UTC برای جلوگیری از شیفت محلی
  const londonDate = new Date(Date.UTC(year, month, day, hour, minute, second));

  return londonDate;
};

export const formatTimeInLondon = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const time = dateObj.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return time;
};

export const formatDateInLondon = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const formatted = dateObj.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatted;
};

export const formatDateInputInLondon = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dateObj);

  const dateParts = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

export const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseStorageDate = (dateValue?: string): Date | null => {
  if (!dateValue) return null;

  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);

  const dateParts = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const zonedTimeAsUtc = Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day),
    Number(dateParts.hour),
    Number(dateParts.minute),
    Number(dateParts.second),
  );

  return zonedTimeAsUtc - date.getTime();
};

export const createLondonDateTime = (date: Date, time: string): string => {
  return createLondonDateTimeFromStorage(formatDateForStorage(date), time);
};

/** Interpret a calendar date and clock time as Europe/London civil time. */
export const createLondonDateTimeFromStorage = (
  dateValue: string,
  time: string,
): string => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (
    !year ||
    !month ||
    !day ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Invalid London date or time");
  }
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  if (
    utcGuess.getUTCFullYear() !== year ||
    utcGuess.getUTCMonth() !== month - 1 ||
    utcGuess.getUTCDate() !== day
  ) {
    throw new Error("Invalid London date or time");
  }
  const londonOffset = getTimeZoneOffsetMs(utcGuess, "Europe/London");
  const result = new Date(utcGuess.getTime() - londonOffset);
  const iso = result.toISOString();
  if (
    formatDateInputInLondon(iso) !== dateValue ||
    formatTimeInLondon(iso) !== time
  ) {
    throw new Error("This London date and time is not available");
  }
  return iso;
};

export const formatDateLabelInLondon = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateObj);
};

export const formatDateTimeLabelInLondon = (
  date: Date | string,
  separator = " at ",
): string => {
  const dateLabel = formatDateLabelInLondon(date);
  if (!dateLabel) return "";
  return `${dateLabel}${separator}${formatTimeInLondon(date)}`;
};

export const formatDateTimeInLondon = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const formatted = dateObj.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatted;
};
