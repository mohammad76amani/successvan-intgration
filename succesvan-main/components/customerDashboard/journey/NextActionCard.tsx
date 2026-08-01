"use client";

import Link from "next/link";
import { FiZap } from "react-icons/fi";
import type { ReservationNextAction } from "@/types/reservation-journey";

export default function NextActionCard({
  action,
  onSectionLink,
}: {
  action: ReservationNextAction;
  onSectionLink?: (sectionId: string) => void;
}) {
  const isSectionLink = action.href?.startsWith("#");
  const highlight = action.type !== "none" && action.type !== "contact_support";

  const button = action.buttonLabel && (
    <span
      className={`inline-flex w-full items-center justify-center px-5 py-3 rounded-lg font-semibold text-sm transition-colors ${
        action.disabled
          ? "bg-white/10 text-gray-500 cursor-not-allowed"
          : highlight
            ? "bg-[#fe9a00] hover:bg-[#e68a00] text-white"
            : "bg-white/10 hover:bg-white/20 text-white"
      }`}
    >
      {action.buttonLabel}
    </span>
  );

  return (
    <aside
      className={`self-start rounded-xl border p-4 ${
        highlight
          ? "border-[#fe9a00]/35 bg-[#fe9a00]/10"
          : "border-white/10 bg-black/15"
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              highlight
                ? "bg-[#fe9a00] text-white"
                : "bg-white/10 text-gray-300"
            }`}
          >
            <FiZap />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
              Next Action
            </p>
            <h3 className="mt-1 text-sm font-black text-white sm:text-base">
              {action.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-300 sm:text-sm">
              {action.description}
            </p>
          </div>
        </div>
        {action.buttonLabel && !action.disabled && (
          <div className="shrink-0">
            {isSectionLink && onSectionLink ? (
              <button
                type="button"
                onClick={() => onSectionLink(action.href!.slice(1))}
                className="w-full cursor-pointer"
              >
                {button}
              </button>
            ) : (
              <Link href={action.href || "#"}>{button}</Link>
            )}
          </div>
        )}
        {action.buttonLabel && action.disabled && (
          <div className="shrink-0">{button}</div>
        )}
      </div>
    </aside>
  );
}
