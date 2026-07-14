"use client";

import { useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DateRange, Range, RangeKeyDict, RangeFocus } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface FullScreenMobileCalendarProps {
  dateRange: Range[];
  onChange: (item: RangeKeyDict) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates: Date[];
  onClose: () => void;
  focusedRange?: RangeFocus;
  onRangeFocusChange?: (focusedRange: RangeFocus) => void;
}

export default function FullScreenMobileCalendar({
  dateRange,
  onChange,
  minDate,
  maxDate,
  disabledDates,
  onClose,
  focusedRange,
  onRangeFocusChange,
}: FullScreenMobileCalendarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate how many months to show from current date to end of year
  const monthsToShow = useMemo(() => {
    const effectiveMinDate = minDate || new Date();
    const effectiveMaxDate = maxDate || new Date(new Date().getFullYear(), 11, 31);
    
    const currentYear = effectiveMinDate.getFullYear();
    const currentMonth = effectiveMinDate.getMonth();
    const endYear = effectiveMaxDate.getFullYear();
    const endMonth = effectiveMaxDate.getMonth();

    if (endYear === currentYear) {
      return endMonth - currentMonth + 1;
    }
    return (endYear - currentYear) * 12 + (12 - currentMonth) + endMonth + 1;
  }, [minDate, maxDate]);

  // Scroll to current month on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const calendarContent = (
    <div
      className="fixed inset-0 z-9999999 flex flex-col min-h-screen bg-slate-700 md:hidden"
      style={{
        animation: "fadeInMobile 0.2s ease-out",
        width: "100vw",
         paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center  px-4 py-3 bg-slate-800 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-white hover:text-amber-400 transition-colors p-2 -ml-2"
          aria-label="Close calendar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-white ml-8 font-semibold text-lg">Select Dates</h2>
      </div>

      {/* Calendar Container - Vertical Scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 py-4"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <DateRange
          className="w-full"
          ranges={dateRange}
          onChange={(item) => onChange(item as RangeKeyDict)}
          minDate={minDate}
          maxDate={maxDate}
          rangeColors={["#fbbf24"]}
          months={monthsToShow}
          scroll={{ enabled: false }}
          disabledDates={disabledDates}
          showMonthAndYearPickers={false}
          showDateDisplay={false}
          focusedRange={focusedRange as RangeFocus | undefined}
          onRangeFocusChange={
            onRangeFocusChange as
              | ((focusedRange: RangeFocus) => void)
              | undefined
          }
          preventSnapRefocus={true}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 w-full absolute bottom-18 bg-slate-200/5 border-t border-white/10  shrink-0 text-center">
        <button
          type="button"
          onClick={onClose}
          className="bg-amber-500 w-full hover:bg-amber-400 text-slate-900 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
        >
          Done
        </button>
      </div>

      {/* Click outside overlay */}
      <div
        className="absolute inset-0 -z-10 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <style jsx global>{`
        @keyframes fadeInMobile {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Override react-date-range styles for full-screen mobile */
        .rdrDateDisplayWrapper {
          display: none !important;
        }
        .rdrCalendarWrapper {
          background-color: transparent !important;
          border: none !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .rdrMonths {
          width: 100% !important;
          flex-direction: column !important;
          gap: 1rem !important;
        }
        .rdrMonth {
          width: 100% !important;
          padding: 0 !important;
        }
        .rdrMonthAndYearPickers {
          display: flex !important;
          justify-content: center !important;
          padding: 8px 0 !important;
        }
        .rdrMonthAndYearPickers span {
          color: #fbbf24 !important;
          font-weight: 600 !important;
          font-size: 16px !important;
        }
        .rdrDayNumber span {
          color: white !important;
          font-weight: 500 !important;
          font-size: 14px !important;
        }
        .rdrDayPassive .rdrDayNumber {
          visibility: hidden !important;
        }
        .rdrDayToday .rdrDayNumber span {
          font-weight: 700 !important;
          background-color: rgba(251, 191, 36, 0.2) !important;
          border-radius: 50% !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .rdrDayInRange {
          background-color: rgba(251, 191, 36, 0.25) !important;
        }
        .rdrDayStartPreview,
        .rdrDayInPreview,
        .rdrDayEndPreview {
          background-color: rgba(251, 191, 36, 0.3) !important;
        }
        .rdrDayStartOfMonth .rdrDayNumber span,
        .rdrDayEndOfMonth .rdrDayNumber span {
          font-weight: 700 !important;
          background-color: !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .rdrDayInRange .rdrDayNumber span {
          color: #0f172a !important;
          font-weight: 600 !important;
        }
        .rdrDayHovered {
          background-color: rgba(251, 191, 36, 0.3) !important;
        }
        .rdrWeekDay {
          color: #fbbf24 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 8px 0 !important;
        }
        .rdrDays {
          padding: 4px 0 !important;
        }
        .rdrDay {
          padding: 4px !important;
        }
        .rdrDayDisabled {
          opacity: 0.3 !important;
        }
        .rdrDayDisabled .rdrDayNumber span {
          color: #6b7280 !important;
          text-decoration: line-through !important;
        }
        /* Hide the navigation arrows since we're showing all months */
        .rdrNextPrevButton {
          display: none !important;
        }
        /* Hide the date display input */
        .rdrDateInput {
          display: none !important;
        }
        /* Prevent body scroll when modal is open */
        body.mobile-calendar-open {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );

  // Use portal to render at document body level
  if (typeof document !== "undefined") {
    return createPortal(calendarContent, document.body);
  }

  return null;
}
