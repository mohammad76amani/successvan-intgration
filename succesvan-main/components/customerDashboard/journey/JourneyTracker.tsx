"use client";

import { FiCheck, FiAlertCircle, FiX } from "react-icons/fi";
import type { ReservationJourneyStep } from "@/types/reservation-journey";

type DisplayJourneyStep = Omit<ReservationJourneyStep, "key"> & {
  key: string;
};

const stateStyles = {
  completed: {
    circle: "bg-green-500 border-green-500 text-white",
    label: "text-white",
    meta: "text-gray-400",
    bar: "bg-green-500",
  },
  current: {
    circle: "bg-[#fe9a00] border-[#fe9a00] text-white",
    label: "text-[#fe9a00]",
    meta: "text-gray-400",
    bar: "bg-white/10",
  },
  blocked: {
    circle: "bg-[#fe9a00] border-[#fe9a00] text-white animate-pulse",
    label: "text-[#fe9a00]",
    meta: "text-gray-400",
    bar: "bg-white/10",
  },
  failed: {
    circle: "bg-red-500 border-red-500 text-white",
    label: "text-red-400",
    meta: "text-gray-400",
    bar: "bg-white/10",
  },
  upcoming: {
    circle: "bg-transparent border-white/20 text-gray-500",
    label: "text-gray-500",
    meta: "text-gray-500",
    bar: "bg-white/10",
  },
} as const;

function StepIcon({ step, index }: { step: DisplayJourneyStep; index: number }) {
  if (step.state === "completed") return <FiCheck className="text-sm" />;
  if (step.state === "failed") return <FiX className="text-sm" />;
  if (step.state === "blocked") return <FiAlertCircle className="text-sm" />;
  return <span className="text-xs font-bold">{index + 1}</span>;
}

export default function JourneyTracker({
  steps,
}: {
  steps: DisplayJourneyStep[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <h3 className="text-white font-black mb-5">Booking progress</h3>

      {/* Desktop: horizontal stepper */}
      <div className="hidden md:flex items-start">
        {steps.map((step, idx) => {
          const style = stateStyles[step.state];
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {idx > 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                    steps[idx - 1].state === "completed"
                      ? "bg-green-500"
                      : "bg-white/10"
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center ${style.circle}`}
              >
                <StepIcon step={step} index={idx} />
              </div>
              <p className={`mt-2 text-xs font-semibold text-center ${style.label}`}>
                {step.label}
              </p>
              {step.date && (
                <p className={`text-[10px] text-center mt-0.5 ${style.meta}`}>
                  {step.date}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="md:hidden space-y-0">
        {steps.map((step, idx) => {
          const style = stateStyles[step.state];
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${style.circle}`}
                >
                  <StepIcon step={step} index={idx} />
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-5 ${
                      step.state === "completed" ? "bg-green-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 border-b border-white/10 pb-4 pt-1.5 last:border-b-0">
                <div>
                  <p className={`text-sm font-bold ${style.label}`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className={`text-xs ${style.meta}`}>{step.date}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold ${style.label}`}>
                  {step.state === "completed"
                    ? "Done"
                    : step.state === "blocked" || step.state === "current"
                      ? "Pending"
                      : step.state === "failed"
                        ? "Issue"
                        : "Upcoming"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
