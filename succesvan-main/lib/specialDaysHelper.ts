export function isSpecialDay(
  specialDays: Array<{ month: number; day: number; isOpen: boolean; startTime?: string; endTime?: string; reason?: string }>,
  date: Date
): { isOpen: boolean; startTime?: string; endTime?: string; reason?: string } | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const special = specialDays.find((s) => s.month === month && s.day === day);
  return special || null;
}

export function getSpecialDayStatus(
  specialDays: Array<{ month: number; day: number; isOpen: boolean; startTime?: string; endTime?: string; reason?: string }>,
  date: Date
): { isOpen: boolean; startTime?: string; endTime?: string; reason?: string } {
  const special = isSpecialDay(specialDays, date);
  return special || { isOpen: true };
}
