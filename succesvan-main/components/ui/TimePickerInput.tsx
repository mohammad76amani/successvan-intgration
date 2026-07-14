"use client";

import { useState, useEffect, useCallback } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

interface TimePickerInputProps {
  value: string;
  onChange: (time: string) => void;
  minTime: string;
  maxTime: string;
  isInline?: boolean;
  className?: string;
}

export default function TimePickerInput({
  value,
  onChange,
  minTime,
  maxTime,
  isInline = false,
  className = "",
}: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(value.split(":")[0]);
  const [minutes, setMinutes] = useState(value.split(":")[1]);

  const minHour = parseInt(minTime.split(":")[0]);
  const minMinute = parseInt(minTime.split(":")[1]);
  const maxHour = parseInt(maxTime.split(":")[0]);
  const maxMinute = parseInt(maxTime.split(":")[1]);

  useEffect(() => {
    setHours(value.split(":")[0]);
    setMinutes(value.split(":")[1]);
  }, [value]);

  const updateTime = useCallback(
    (h: string, m: string) => {
      const hNum = parseInt(h);
      const mNum = parseInt(m);
      const timeNum = hNum * 60 + mNum;
      const minNum = minHour * 60 + minMinute;
      const maxNum = maxHour * 60 + maxMinute;

      if (timeNum >= minNum && timeNum <= maxNum) {
        setHours(h);
        setMinutes(m);
        onChange(`${h.padStart(2, "0")}:${m.padStart(2, "0")}`);
      }
    },
    [minHour, minMinute, maxHour, maxMinute, onChange]
  );

  const incrementHour = useCallback(() => {
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const currentTime = h * 60 + m;
    const maxTimeNum = maxHour * 60 + maxMinute;

    if (currentTime < maxTimeNum) {
      updateTime(`${h + 1}`, minutes);
    }
  }, [hours, minutes, maxHour, maxMinute, updateTime]);

  const decrementHour = useCallback(() => {
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const currentTime = h * 60 + m;
    const minTimeNum = minHour * 60 + minMinute;

    if (currentTime > minTimeNum) {
      updateTime(`${h - 1}`, minutes);
    }
  }, [hours, minutes, minHour, minMinute, updateTime]);

  const incrementMinute = useCallback(() => {
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const currentTime = h * 60 + m;
    const maxTimeNum = maxHour * 60 + maxMinute;

    if (currentTime + 15 <= maxTimeNum) {
      const newM = m + 15;
      if (newM <= 59) {
        updateTime(hours, `${newM}`);
      } else {
        updateTime(`${h + 1}`, "00");
      }
    }
  }, [hours, minutes, maxHour, maxMinute, updateTime]);

  const decrementMinute = useCallback(() => {
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const currentTime = h * 60 + m;
    const minTimeNum = minHour * 60 + minMinute;

    if (currentTime - 15 >= minTimeNum) {
      const newM = m - 15;
      if (newM >= 0) {
        updateTime(hours, `${newM}`);
      } else {
        updateTime(`${h - 1}`, "45");
      }
    }
  }, [hours, minutes, minHour, minMinute, updateTime]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/10 border border-white/20 rounded-lg text-white text-left focus:outline-none focus:border-amber-400 transition-colors ${
          isInline ? "px-2 py-2 text-xs" : "px-4 py-1.75 text-sm"
        } ${className}`}
        aria-label="Time picker"
      >
        {value}
      </button>

      {isOpen && (
        <div className="absolute -top-32 left-0 mt-2 z-99999 bg-slate-800 border border-white/20 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHour}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Increase hour"
              >
                <FiChevronUp className="text-white text-lg" />
              </button>
              <div className="text-white text-2xl font-bold w-12 text-center py-2">
                {hours}
              </div>
              <button
                type="button"
                onClick={decrementHour}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Decrease hour"
              >
                <FiChevronDown className="text-white text-lg" />
              </button>
            </div>

            <div className="text-white text-2xl font-bold">:</div>

            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementMinute}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Increase minute"
              >
                <FiChevronUp className="text-white text-lg" />
              </button>
              <div className="text-white text-2xl font-bold w-12 text-center py-2">
                {minutes}
              </div>
              <button
                type="button"
                onClick={decrementMinute}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Decrease minute"
              >
                <FiChevronDown className="text-white text-lg" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 px-3 py-1.5 bg-amber-500 text-slate-900 font-semibold rounded text-xs hover:bg-amber-400 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
