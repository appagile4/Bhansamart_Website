"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check,
} from "lucide-react";

export interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ISO string
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  label?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  accent?: "teal" | "emerald" | "blue";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Helper: parse "YYYY-MM-DD" safely
function parseDateParts(val: string): { year: number; month: number; day: number } | null {
  if (!val) return null;
  try {
    const clean = val.includes("T") ? val.split("T")[0] : val;
    const parts = clean.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1000) {
        return { year: y, month: m, day: d };
      }
    }
  } catch {}
  return null;
}

// Format "YYYY-MM-DD" into human readable "15 Oct 1995"
export function formatDisplayDate(val: string): string {
  const parts = parseDateParts(val);
  if (!parts) return "";
  return `${parts.day} ${MONTH_NAMES_SHORT[parts.month]} ${parts.year}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  label,
  className = "",
  inputClassName = "",
  disabled = false,
  required = false,
  id,
  name,
  accent = "teal",
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  // Initial parsed date
  const parsed = parseDateParts(value);
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Navigation state (month & year being viewed)
  const [viewYear, setViewYear] = useState<number>(parsed ? parsed.year : todayYear);
  const [viewMonth, setViewMonth] = useState<number>(parsed ? parsed.month : todayMonth);
  // Year grid window start
  const [yearWindowStart, setYearWindowStart] = useState<number>(
    Math.floor((parsed ? parsed.year : todayYear) / 12) * 12
  );

  // Sync viewed month/year when value changes from outside
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setYearWindowStart(Math.floor(parsed.year / 12) * 12);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode("days");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Accent styling classes
  const accentClasses = {
    teal: {
      activeBg: "bg-[#0B4D58] text-white",
      hoverBg: "hover:bg-[#0B4D58]/10 text-slate-800",
      activeText: "text-[#0B4D58]",
      borderFocus: "focus-within:border-[#0B4D58]",
      btnBg: "bg-[#0B4D58] hover:bg-[#083a42] text-white",
      ring: "ring-[#0B4D58]/20",
    },
    emerald: {
      activeBg: "bg-[#0C831F] text-white",
      hoverBg: "hover:bg-[#0C831F]/10 text-slate-800",
      activeText: "text-[#0C831F]",
      borderFocus: "focus-within:border-[#0C831F]",
      btnBg: "bg-[#0C831F] hover:bg-[#096417] text-white",
      ring: "ring-[#0C831F]/20",
    },
    blue: {
      activeBg: "bg-blue-600 text-white",
      hoverBg: "hover:bg-blue-50 text-slate-800",
      activeText: "text-blue-600",
      borderFocus: "focus-within:border-blue-500",
      btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
      ring: "ring-blue-500/20",
    },
  }[accent];

  // Helper to check min / max boundary
  const isDateDisabled = (y: number, m: number, d: number) => {
    const targetStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (minDate && targetStr < minDate) return true;
    if (maxDate && targetStr > maxDate) return true;
    return false;
  };

  const isToday = (y: number, m: number, d: number) => {
    return y === todayYear && m === todayMonth && d === todayDay;
  };

  const isSelected = (y: number, m: number, d: number) => {
    return parsed ? parsed.year === y && parsed.month === m && parsed.day === d : false;
  };

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select day
  const handleSelectDay = (y: number, m: number, d: number) => {
    if (isDateDisabled(y, m, d)) return;
    const formatted = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
    setViewMode("days");
  };

  // Select today quick action
  const handleSelectToday = () => {
    if (!isDateDisabled(todayYear, todayMonth, todayDay)) {
      handleSelectDay(todayYear, todayMonth, todayDay);
    }
  };

  // Clear date
  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("");
  };

  // Generate calendar days for current viewMonth & viewYear
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
  }> = [];

  // Prev month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarDays.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    calendarDays.push({ day: i, month: viewMonth, year: viewYear, isCurrentMonth: true });
  }

  // Next month padding to fill 42 cells (6 rows * 7 columns)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarDays.push({ day: i, month: m, year: y, isCurrentMonth: false });
  }

  const displayString = parsed ? formatDisplayDate(value) : "";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form submissions */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        id={id}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setViewMode("days");
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
            setViewMode("days");
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/60 hover:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm transition cursor-pointer select-none ${
          accentClasses.borderFocus
        } ${isOpen ? "bg-white border-[#0B4D58] ring-2 ring-[#0B4D58]/10 shadow-sm" : ""} ${
          disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : ""
        } ${inputClassName}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon
            className={`w-4 h-4 shrink-0 transition ${
              isOpen || displayString ? accentClasses.activeText : "text-slate-400"
            }`}
          />
          <span
            className={`truncate font-medium ${
              displayString ? "text-slate-900" : "text-slate-400 font-normal"
            }`}
          >
            {displayString || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          {displayString && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
            {parsed ? parsed.year : ""}
          </span>
        </div>
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-[310px] sm:w-[325px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
            {/* Prev year / month */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === "years") {
                    setYearWindowStart((y) => y - 12);
                  } else {
                    setViewYear((y) => y - 1);
                  }
                }}
                title="Previous Year"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              {viewMode === "days" && (
                <button
                  type="button"
                  onClick={prevMonth}
                  title="Previous Month"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Month & Year Title buttons */}
            <div className="flex items-center gap-1 font-bold text-slate-800 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "months" ? "days" : "months")}
                className={`px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer ${
                  viewMode === "months" ? "bg-slate-100 text-[#0B4D58]" : ""
                }`}
              >
                {MONTH_NAMES[viewMonth]}
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearWindowStart(Math.floor(viewYear / 12) * 12);
                  setViewMode(viewMode === "years" ? "days" : "years");
                }}
                className={`px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer ${
                  viewMode === "years" ? "bg-slate-100 text-[#0B4D58]" : ""
                }`}
              >
                {viewYear}
              </button>
            </div>

            {/* Next year / month */}
            <div className="flex items-center gap-0.5">
              {viewMode === "days" && (
                <button
                  type="button"
                  onClick={nextMonth}
                  title="Next Month"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (viewMode === "years") {
                    setYearWindowStart((y) => y + 12);
                  } else {
                    setViewYear((y) => y + 1);
                  }
                }}
                title="Next Year"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1. DAYS VIEW */}
          {viewMode === "days" && (
            <div>
              {/* Day header names */}
              <div className="grid grid-cols-7 mb-1.5">
                {DAY_NAMES.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-[11px] font-bold py-1 ${
                      i === 0 || i === 6 ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  const disabledDay = isDateDisabled(item.year, item.month, item.day);
                  const selectedDay = isSelected(item.year, item.month, item.day);
                  const todayDayCell = isToday(item.year, item.month, item.day);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => handleSelectDay(item.year, item.month, item.day)}
                      className={`h-8 w-8 sm:h-8.5 sm:w-8.5 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition cursor-pointer ${
                        selectedDay
                          ? `${accentClasses.activeBg} font-bold shadow-sm scale-105`
                          : disabledDay
                          ? "text-slate-300 opacity-40 cursor-not-allowed"
                          : item.isCurrentMonth
                          ? `text-slate-800 ${accentClasses.hoverBg}`
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/60"
                      } ${
                        todayDayCell && !selectedDay
                          ? "ring-1.5 ring-[#0B4D58] font-bold text-[#0B4D58]"
                          : ""
                      }`}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MONTHS PICKER VIEW */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {MONTH_NAMES_SHORT.map((mShort, idx) => {
                const active = viewMonth === idx;
                return (
                  <button
                    key={mShort}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setViewMode("days");
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active
                        ? accentClasses.activeBg
                        : "text-slate-700 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    {mShort}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. YEARS PICKER VIEW */}
          {viewMode === "years" && (
            <div>
              <div className="text-center text-[11px] font-bold text-slate-400 mb-2">
                {yearWindowStart} – {yearWindowStart + 11}
              </div>
              <div className="grid grid-cols-3 gap-2 py-1">
                {Array.from({ length: 12 }, (_, i) => yearWindowStart + i).map((yr) => {
                  const active = viewYear === yr;
                  const futureRestricted = Boolean(
                    (maxDate && `${yr}-01-01` > maxDate) || (minDate && `${yr}-12-31` < minDate)
                  );
                  return (
                    <button
                      key={yr}
                      type="button"
                      disabled={futureRestricted}
                      onClick={() => {
                        setViewYear(yr);
                        setViewMode("months");
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        active
                          ? accentClasses.activeBg
                          : "text-slate-700 hover:bg-slate-100 border border-slate-100"
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              disabled={isDateDisabled(todayYear, todayMonth, todayDay)}
              className="font-bold text-[#0B4D58] hover:underline cursor-pointer disabled:opacity-30 disabled:no-underline"
            >
              Today
            </button>

            <div className="flex items-center gap-2">
              {displayString && (
                <button
                  type="button"
                  onClick={() => {
                    handleClear();
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setViewMode("days");
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
