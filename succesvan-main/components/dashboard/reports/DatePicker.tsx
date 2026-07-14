"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onChange(newDate.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) 
    : placeholder;

  return (
    <div ref={dropdownRef} className="relative w-full">
      {label && (
        <label className="text-gray-300 text-sm font-semibold mb-2 block">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all hover:border-white/30"
      >
        <FiCalendar className="text-[#fe9a00]  shrink-0" />
        <span className="flex-1 text-left text-sm">{displayValue}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/20 rounded-lg shadow-2xl z-50 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiChevronLeft className="text-[#fe9a00]" />
            </button>
            <h3 className="text-white font-semibold text-sm">{monthYear}</h3>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiChevronRight className="text-[#fe9a00]" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();

              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                    isSelected
                      ? "bg-[#fe9a00] text-black font-bold shadow-lg shadow-[#fe9a00]/50"
                      : isToday
                      ? "bg-white/10 text-white border border-[#fe9a00]/50"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            onClick={() => {
              const today = new Date();
              onChange(today.toISOString().split("T")[0]);
              setIsOpen(false);
            }}
            className="w-full mt-4 py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors border border-white/10"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
