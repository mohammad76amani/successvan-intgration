import type { Office, SpecialDay, WorkingTime } from "@/types/type";

type SpecialDayWindow = {
  startTime: string;
  endTime: string;
};

function fallbackWindow(specialDay: SpecialDay): SpecialDayWindow {
  return {
    startTime: specialDay.startTime || "00:00",
    endTime: specialDay.endTime || "23:59",
  };
}

export function findSpecialDayForDate(
  specialDays: SpecialDay[] | undefined,
  date: Date,
) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return specialDays?.find(
    (specialDay) => specialDay.month === month && specialDay.day === day,
  );
}

export function getSpecialDayPickupWindow(
  specialDay: SpecialDay,
): SpecialDayWindow {
  const fallback = fallbackWindow(specialDay);

  return {
    startTime:
      specialDay.pickupTime?.startTime ||
      specialDay.pickupExtension?.startTime ||
      fallback.startTime,
    endTime:
      specialDay.pickupTime?.endTime ||
      specialDay.pickupExtension?.endTime ||
      fallback.endTime,
  };
}

export function getSpecialDayReturnWindow(
  specialDay: SpecialDay,
): SpecialDayWindow {
  const fallback = fallbackWindow(specialDay);

  return {
    startTime:
      specialDay.returnTime?.startTime ||
      specialDay.returnExtension?.startTime ||
      specialDay.pickupTime?.startTime ||
      specialDay.pickupExtension?.startTime ||
      fallback.startTime,
    endTime:
      specialDay.returnTime?.endTime ||
      specialDay.returnExtension?.endTime ||
      specialDay.pickupTime?.endTime ||
      specialDay.pickupExtension?.endTime ||
      fallback.endTime,
  };
}

export function isSameCalendarDate(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

export function shouldSkipSameDayReturnExtension(
  pickupDate: Date | null | undefined,
  returnDate: Date | null | undefined,
  pickupExtensionPrice: number,
  returnExtensionPrice: number,
) {
  return Boolean(
    pickupDate &&
      returnDate &&
      pickupExtensionPrice > 0 &&
      returnExtensionPrice > 0 &&
      isSameCalendarDate(pickupDate, returnDate),
  );
}

type ExtensionKind = "pickupExtension" | "returnExtension";
type WorkingWindowKind = "pickup" | "return";

type ExtensionPriceInput = {
  office: Office;
  pickupDate?: Date | null;
  pickupTime?: string;
  returnDate?: Date | null;
  returnTime?: string;
};

type WorkingWindow = {
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

export type WorkingExtensionRange = {
  startTime: string;
  endTime: string;
  flatPrice: number;
};

function getDayName(date: Date): WorkingTime["day"] {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()] as WorkingTime["day"];
}

function toMinutes(time?: string, fallback = "00:00") {
  const [hours, minutes] = (time || fallback).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  return hours * 60 + minutes;
}

function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function getExtensionKey(kind: WorkingWindowKind): ExtensionKind {
  return kind === "pickup" ? "pickupExtension" : "returnExtension";
}

export function getWorkingDayWindow(
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
): WorkingWindow {
  const timeWindow =
    kind === "pickup" ? workingDay.pickupTime : workingDay.returnTime;
  const hasDedicatedWindow = Boolean(timeWindow);

  return {
    isOpen: timeWindow?.isOpen ?? workingDay.isOpen,
    startTime: hasDedicatedWindow
      ? timeWindow?.startTime || "00:00"
      : workingDay.startTime || "00:00",
    endTime: hasDedicatedWindow
      ? timeWindow?.endTime || "23:59"
      : workingDay.endTime || "23:59",
  };
}

export function getWorkingDayWindowWithExtension(
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
) {
  const window = getWorkingDayWindow(workingDay, kind);
  if (!window.isOpen) return undefined;

  const startMinutes = toMinutes(window.startTime);
  const endMinutes = toMinutes(window.endTime);

  if (startMinutes === undefined || endMinutes === undefined) {
    return undefined;
  }

  const extensionRanges = getWorkingDayExtensionRanges(workingDay, kind);
  if (startMinutes === endMinutes && extensionRanges.length === 0) {
    return undefined;
  }

  const rangeMinutes = [
    ...(startMinutes === endMinutes ? [] : [startMinutes, endMinutes]),
    ...extensionRanges.flatMap((range) => [
      toMinutes(range.startTime),
      toMinutes(range.endTime),
    ]),
  ].filter((value): value is number => value !== undefined);

  if (rangeMinutes.length === 0) return undefined;

  // Kept for backwards compatibility with older call sites. New slot
  // generation should use getWorkingDayTimeSlots to avoid filling gaps.
  return {
    startTime: toTime(Math.min(...rangeMinutes)),
    endTime: toTime(Math.max(...rangeMinutes)),
  };
}

function buildLegacyExtensionRanges(
  window: WorkingWindow,
  extension: WorkingTime[ExtensionKind],
) {
  if (!extension) return [];

  const startMinutes = toMinutes(window.startTime);
  const endMinutes = toMinutes(window.endTime);
  if (startMinutes === undefined || endMinutes === undefined) return [];

  const hoursBefore = extension.hoursBefore || 0;
  const hoursAfter = extension.hoursAfter || 0;
  const flatPrice = extension.flatPrice || 0;
  const ranges: WorkingExtensionRange[] = [];

  if (hoursBefore > 0) {
    ranges.push({
      startTime: toTime(Math.max(0, startMinutes - hoursBefore * 60)),
      endTime: window.startTime,
      flatPrice,
    });
  }

  if (hoursAfter > 0) {
    ranges.push({
      startTime: window.endTime,
      endTime: toTime(Math.min(1439, endMinutes + hoursAfter * 60)),
      flatPrice,
    });
  }

  return ranges;
}

export function getWorkingDayExtensionRanges(
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
): WorkingExtensionRange[] {
  const normalWindow = getWorkingDayWindow(workingDay, kind);
  const extension = workingDay[getExtensionKey(kind)];
  if (!normalWindow.isOpen || !extension) return [];

  if (extension.startTime && extension.endTime) {
    return [
      {
        startTime: extension.startTime,
        endTime: extension.endTime,
        flatPrice: extension.flatPrice || 0,
      },
    ];
  }

  return buildLegacyExtensionRanges(normalWindow, extension);
}

function generateSlotsForRange(
  startTime: string,
  endTime: string,
  interval: number,
) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  if (
    startMinutes === undefined ||
    endMinutes === undefined ||
    startMinutes > endMinutes
  ) {
    return [];
  }

  const slots: string[] = [];
  for (
    let currentMinutes = startMinutes;
    currentMinutes <= endMinutes;
    currentMinutes += interval
  ) {
    slots.push(toTime(currentMinutes));
  }

  return slots;
}

export function getWorkingDayTimeSlots(
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
  interval = 15,
) {
  const normalWindow = getWorkingDayWindow(workingDay, kind);
  if (!normalWindow.isOpen) return [];

  const slots =
    normalWindow.startTime === normalWindow.endTime
      ? []
      : generateSlotsForRange(
          normalWindow.startTime,
          normalWindow.endTime,
          interval,
        );

  getWorkingDayExtensionRanges(workingDay, kind).forEach((range) => {
    slots.push(...generateSlotsForRange(range.startTime, range.endTime, interval));
  });

  return Array.from(new Set(slots)).sort();
}

function calculateRegularExtensionPrice(
  workingDay: WorkingTime | undefined,
  selectedTime: string | undefined,
  kind: WorkingWindowKind,
) {
  if (!workingDay) return 0;
  const normalWindow = getWorkingDayWindow(workingDay, kind);
  if (!normalWindow.isOpen) return 0;

  const extensionKind = getExtensionKey(kind);
  const extension = workingDay[extensionKind];
  if (!extension || !selectedTime) return 0;

  const selectedMinutes = toMinutes(selectedTime);
  const startMinutes = toMinutes(normalWindow.startTime);
  const endMinutes = toMinutes(normalWindow.endTime);

  if (
    selectedMinutes === undefined ||
    startMinutes === undefined ||
    endMinutes === undefined
  ) {
    return 0;
  }

  const isClosedNormalWindow = startMinutes === endMinutes;
  const isOutsideNormalWindow =
    selectedMinutes < startMinutes || selectedMinutes > endMinutes;

  if (!isClosedNormalWindow && !isOutsideNormalWindow) return 0;

  const extensionRange = getWorkingDayExtensionRanges(workingDay, kind).find(
    (range) => {
      const rangeStart = toMinutes(range.startTime);
      const rangeEnd = toMinutes(range.endTime);
      return (
        rangeStart !== undefined &&
        rangeEnd !== undefined &&
        selectedMinutes >= rangeStart &&
        selectedMinutes <= rangeEnd
      );
    },
  );

  return extensionRange?.flatPrice || 0;
}

export function calculateOfficeExtensionPrices({
  office,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
}: ExtensionPriceInput) {
  let pickupExtension = 0;
  let returnExtension = 0;

  if (pickupDate && pickupTime) {
    const pickupSpecialDay = findSpecialDayForDate(
      office.specialDays,
      pickupDate,
    );

    if (pickupSpecialDay?.isOpen) {
      pickupExtension = pickupSpecialDay.extraPrice || 0;
    } else {
      const pickupDaySchedule = office.workingTime?.find(
        (workingDay) =>
          workingDay.day === getDayName(pickupDate) && workingDay.isOpen,
      );

      pickupExtension = calculateRegularExtensionPrice(
        pickupDaySchedule,
        pickupTime,
        "pickup",
      );
    }
  }

  if (returnDate && returnTime) {
    const returnSpecialDay = findSpecialDayForDate(
      office.specialDays,
      returnDate,
    );

    if (returnSpecialDay?.isOpen) {
      const pickupSpecialDay = pickupDate
        ? findSpecialDayForDate(office.specialDays, pickupDate)
        : undefined;
      const isSamePricedSpecialDay = Boolean(
        pickupDate &&
          pickupSpecialDay?.isOpen &&
          pickupSpecialDay.month === returnSpecialDay.month &&
          pickupSpecialDay.day === returnSpecialDay.day &&
          isSameCalendarDate(pickupDate, returnDate),
      );

      returnExtension = isSamePricedSpecialDay
        ? 0
        : returnSpecialDay.extraPrice || 0;
    } else {
      const returnDaySchedule = office.workingTime?.find(
        (workingDay) =>
          workingDay.day === getDayName(returnDate) && workingDay.isOpen,
      );

      returnExtension = calculateRegularExtensionPrice(
        returnDaySchedule,
        returnTime,
        "return",
      );
    }
  }

  if (
    shouldSkipSameDayReturnExtension(
      pickupDate,
      returnDate,
      pickupExtension,
      returnExtension,
    )
  ) {
    returnExtension = 0;
  }

  return { pickupExtension, returnExtension };
}
