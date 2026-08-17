import { formatDateInputInLondon } from "@/lib/englandTime";

export function contractNumberDatePrefix(date: Date) {
  const [year, month, day] = formatDateInputInLondon(date).split("-");
  return `${year.slice(-2)}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
}

export function formatContractNumber(prefix: string, sequence: number) {
  return `${prefix}-${Math.max(1, Math.trunc(sequence))}`;
}
