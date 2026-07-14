type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanTime(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeTimeWindow(value: unknown) {
  if (!isPlainObject(value)) return undefined;

  const startTime = cleanTime(value.startTime);
  const endTime = cleanTime(value.endTime);

  if (!startTime && !endTime) return undefined;

  return {
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
  };
}

function cleanBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeWorkingTimeWindow(value: unknown, fallback?: PlainObject) {
  const source = isPlainObject(value) ? value : undefined;

  if (!source) {
    const fallbackStartTime = cleanTime(fallback?.startTime);
    const fallbackEndTime = cleanTime(fallback?.endTime);
    if (!fallbackStartTime && !fallbackEndTime && !fallback) {
      return undefined;
    }

    return {
      isOpen: cleanBoolean(fallback?.isOpen),
      ...(fallbackStartTime ? { startTime: fallbackStartTime } : {}),
      ...(fallbackEndTime ? { endTime: fallbackEndTime } : {}),
    };
  }

  const startTime = cleanTime(source.startTime);
  const endTime = cleanTime(source.endTime);
  const isOpen = cleanBoolean(source.isOpen, cleanBoolean(fallback?.isOpen));

  if (!startTime && !endTime && source.isOpen === undefined) {
    return undefined;
  }

  return {
    isOpen,
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
  };
}

function normalizeWorkingExtension(value: unknown) {
  const source = isPlainObject(value) ? value : undefined;

  return {
    ...(cleanTime(source?.startTime)
      ? { startTime: cleanTime(source?.startTime) }
      : {}),
    ...(cleanTime(source?.endTime)
      ? { endTime: cleanTime(source?.endTime) }
      : {}),
    hoursBefore: cleanNumber(source?.hoursBefore),
    hoursAfter: cleanNumber(source?.hoursAfter),
    flatPrice: cleanNumber(source?.flatPrice),
  };
}

function normalizeWorkingDay(workingDay: unknown) {
  if (!isPlainObject(workingDay)) return workingDay;

  const normalized = { ...workingDay };
  const legacyWindow = normalizeWorkingTimeWindow({
    isOpen: normalized.isOpen,
    startTime: normalized.startTime,
    endTime: normalized.endTime,
  });
  const pickupTime =
    normalizeWorkingTimeWindow(normalized.pickupTime, legacyWindow) ||
    legacyWindow;
  const returnTime =
    normalizeWorkingTimeWindow(normalized.returnTime, legacyWindow) ||
    legacyWindow;

  if (pickupTime) {
    normalized.pickupTime = pickupTime;
  }
  if (returnTime) {
    normalized.returnTime = returnTime;
  }

  if (!cleanTime(normalized.startTime) && pickupTime?.startTime) {
    normalized.startTime = pickupTime.startTime;
  }
  if (!cleanTime(normalized.endTime) && pickupTime?.endTime) {
    normalized.endTime = pickupTime.endTime;
  }

  normalized.pickupExtension = normalizeWorkingExtension(
    normalized.pickupExtension,
  );
  normalized.returnExtension = normalizeWorkingExtension(
    normalized.returnExtension,
  );

  return normalized;
}

function normalizeSpecialDay(specialDay: unknown) {
  if (!isPlainObject(specialDay)) return specialDay;

  const normalized = { ...specialDay };
  const pickupTime =
    normalizeTimeWindow(normalized.pickupTime) ||
    normalizeTimeWindow(normalized.pickupExtension) ||
    normalizeTimeWindow({
      startTime: normalized.startTime,
      endTime: normalized.endTime,
    });
  const returnTime =
    normalizeTimeWindow(normalized.returnTime) ||
    normalizeTimeWindow(normalized.returnExtension) ||
    normalizeTimeWindow({
      startTime: normalized.startTime,
      endTime: normalized.endTime,
    });

  if (pickupTime) {
    normalized.pickupTime = pickupTime;
    normalized.startTime = pickupTime.startTime;
    normalized.endTime = pickupTime.endTime;
  } else {
    delete normalized.pickupTime;
  }

  if (returnTime) {
    normalized.returnTime = returnTime;
  } else {
    delete normalized.returnTime;
  }

  delete normalized.pickupExtension;
  delete normalized.returnExtension;

  return normalized;
}

export function normalizeOfficePayload<T extends PlainObject>(payload: T): T {
  const normalizedPayload = {
    ...payload,
    ...(Array.isArray(payload.workingTime)
      ? { workingTime: payload.workingTime.map(normalizeWorkingDay) }
      : {}),
  };

  return {
    ...normalizedPayload,
    ...(Array.isArray(payload.specialDays)
      ? { specialDays: payload.specialDays.map(normalizeSpecialDay) }
      : {}),
  } as T;
}
