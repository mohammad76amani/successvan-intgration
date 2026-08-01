"use client";

import { useEffect, useMemo, useState } from "react";
import { FiClock } from "react-icons/fi";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  reached: boolean;
};

const getInclusiveDeadline = (value: string) => {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const deadline = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      23,
      59,
      59,
      999,
    );
    return Number.isNaN(deadline.getTime()) ? null : deadline;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const calculateRemaining = (deadline: Date): TimeRemaining => {
  const difference = Math.max(0, deadline.getTime() - Date.now());

  return {
    days: Math.floor(difference / DAY),
    hours: Math.floor((difference % DAY) / HOUR),
    minutes: Math.floor((difference % HOUR) / MINUTE),
    seconds: Math.floor((difference % MINUTE) / SECOND),
    reached: difference === 0,
  };
};

const units: Array<{ key: keyof Omit<TimeRemaining, "reached">; label: string }> =
  [
    { key: "days", label: "Days" },
    { key: "hours", label: "Hours" },
    { key: "minutes", label: "Minutes" },
    { key: "seconds", label: "Seconds" },
  ];

export default function RefundCountdown({ expectedBy }: { expectedBy: string }) {
  const deadline = useMemo(() => getInclusiveDeadline(expectedBy), [expectedBy]);
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    if (!deadline) return;

    const update = () => setRemaining(calculateRemaining(deadline));
    update();
    const timer = window.setInterval(update, SECOND);

    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline || !remaining) return null;

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(deadline);

  return (
    <section className="border-t border-[#fe9a00]/20 bg-gradient-to-r from-[#fe9a00]/[0.07] via-[#fe9a00]/[0.025] to-transparent px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#fe9a00]/25 bg-[#fe9a00]/10 text-[#fe9a00] shadow-[0_0_18px_rgba(254,154,0,0.08)]">
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#182238] bg-[#fe9a00]"
            />
            <FiClock aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-extrabold text-white">
                Refund processing
              </p>
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#fe9a00]">
                In progress
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-gray-400">
              Your deposit refund is being processed. Expected by{" "}
              <span className="font-semibold text-gray-200">{formattedDate}</span>
            </p>
          </div>
        </div>

        {remaining.reached ? (
          <div
            className="shrink-0 border-l-2 border-[#fe9a00]/50 pl-3 sm:max-w-sm"
            aria-live="polite"
          >
            <p className="text-sm font-bold text-white">
              Expected refund date reached
            </p>
            <p className="mt-0.5 text-xs leading-5 text-gray-400">
              Bank processing may take a short time to appear.
            </p>
          </div>
        ) : (
          <div
            className="grid w-full grid-cols-4 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c1425]/55 sm:w-auto sm:min-w-[310px]"
            aria-label={`Refund expected by ${formattedDate}`}
          >
            {units.map(({ key, label }, index) => (
              <div
                key={key}
                className={`min-w-0 px-2 py-1.5 text-center ${
                  index > 0 ? "border-l border-white/[0.08]" : ""
                }`}
              >
                <span className="block text-base font-black tabular-nums leading-5 text-white sm:text-lg">
                  {String(remaining[key]).padStart(2, "0")}
                </span>
                <span className="block truncate text-[9px] font-bold uppercase tracking-[0.08em] text-gray-500 sm:text-[10px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
