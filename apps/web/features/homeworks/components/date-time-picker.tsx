"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";
import React, { useState, useRef, useEffect, useMemo } from "react";

interface DateTimePickerProps {
  value: string; // Format: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  placeholder?: string;
}

function parseLocalStringToDate(str: string): Date {
  if (!str) return new Date();
  const [datePart, timePart] = str.split("T");
  if (!datePart || !timePart) return new Date();
  const [yyyy, mm, dd] = datePart.split("-").map(Number);
  const [hh, min] = timePart.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min);
}

function formatDateToLocalString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function DateTimePicker({ value, onChange, placeholder = "Chọn ngày giờ..." }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Parse current date values
  const selectedDate = useMemo(() => {
    return value ? parseLocalStringToDate(value) : new Date();
  }, [value]);

  // Calendar month state
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? parseLocalStringToDate(value) : new Date();
  });

  // Keep track of internal temp states when picker is open
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState<"AM" | "PM">("AM");

  // Sync temp time states when selectedDate changes or modal opens
  useEffect(() => {
    if (selectedDate) {
      const rawHour = selectedDate.getHours();
      const ampm = rawHour >= 12 ? "PM" : "AM";
      const displayHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
      setTempHour(displayHour);
      setTempMinute(selectedDate.getMinutes());
      setTempAmPm(ampm);
    }
  }, [selectedDate, isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Display text formatted
  const displayText = useMemo(() => {
    if (!value) return placeholder;
    const date = parseLocalStringToDate(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const rawHour = date.getHours();
    const ampm = rawHour >= 12 ? "PM" : "AM";
    const displayHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${String(displayHour).padStart(2, "0")}:${minute} ${ampm}`;
  }, [value, placeholder]);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay(); // 0 = Sun, 6 = Sat
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const days = [];

    // Add empty spacer cells for preceding month
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }

    // Add days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const handleDateSelect = (date: Date) => {
    let targetHour = tempHour;
    if (tempAmPm === "PM" && tempHour < 12) targetHour += 12;
    if (tempAmPm === "AM" && tempHour === 12) targetHour = 0;

    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      targetHour,
      tempMinute
    );
    onChange(formatDateToLocalString(newDate));
  };

  const handleTimeChange = (type: "hour" | "minute" | "ampm", val: any) => {
    let targetHour = tempHour;
    let targetMinute = tempMinute;
    let targetAmPm = tempAmPm;

    if (type === "hour") {
      targetHour = val;
      setTempHour(val);
    } else if (type === "minute") {
      targetMinute = val;
      setTempMinute(val);
    } else if (type === "ampm") {
      targetAmPm = val;
      setTempAmPm(val);
    }

    let finalHour = targetHour;
    if (targetAmPm === "PM" && targetHour < 12) finalHour += 12;
    if (targetAmPm === "AM" && targetHour === 12) finalHour = 0;

    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      finalHour,
      targetMinute
    );
    onChange(formatDateToLocalString(newDate));
  };

  const setToday = () => {
    const today = new Date();
    onChange(formatDateToLocalString(today));
    setCurrentMonth(today);
  };

  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between gap-2.5 rounded-md border border-gray-250 bg-gray-50 px-4 py-2 text-sm text-dark-blue outline-none transition-all hover:bg-gray-100/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="size-4 flex-shrink-0 text-primary" />
          <span className={`truncate ${!value ? "text-gray-400 dark:text-gray-navy" : "font-medium"}`}>
            {displayText}
          </span>
        </span>
        <Clock className="size-4 flex-shrink-0 text-gray-navy dark:text-light-blue" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 lg:left-auto right-0 z-50 mt-1.5 flex flex-col rounded-md border border-gray-250 bg-white p-4 shadow-2xl dark:border-white/15 dark:bg-zinc-900 w-[320px] sm:w-[460px]"
          >
            {/* Upper Section: Calendar & Time columns side-by-side */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Calendar Month panel */}
              <div className="flex flex-col w-full sm:w-[240px] flex-shrink-0">
                {/* Calendar Month Selector Header */}
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-white/5">
                  <span className="text-xs font-black text-dark-blue dark:text-white uppercase tracking-wide">
                    Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="rounded p-1 text-gray-navy hover:bg-gray-100 dark:text-light-blue dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="rounded p-1 text-gray-navy hover:bg-gray-100 dark:text-light-blue dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 text-center text-[9px] font-bold text-gray-navy dark:text-light-blue/70 mb-1">
                  {weekdays.map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Month Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                  {calendarDays.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="size-7" />;

                    const isSelected =
                      date.getDate() === selectedDate.getDate() &&
                      date.getMonth() === selectedDate.getMonth() &&
                      date.getFullYear() === selectedDate.getFullYear();

                    const isToday =
                      date.getDate() === new Date().getDate() &&
                      date.getMonth() === new Date().getMonth() &&
                      date.getFullYear() === new Date().getFullYear();

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        className={`flex size-7 items-center justify-center rounded transition-all text-[11px] ${isSelected
                          ? "bg-primary text-white font-bold shadow-sm shadow-primary/30 scale-105"
                          : isToday
                            ? "border border-primary text-primary font-bold dark:border-primary"
                            : "text-dark-blue dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                          }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection panel */}
              <div className="flex-1 flex flex-col border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-white/5 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-xs font-black text-dark-blue dark:text-white mb-2 uppercase tracking-wide flex items-center gap-1.5 justify-center sm:justify-start">
                  <Clock className="size-3.5 text-primary" /> Giờ & Phút
                </span>

                {/* Columns grid */}
                <div className="flex gap-2 justify-center sm:justify-start h-40">
                  {/* Hours column */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/60 mb-1">Giờ</span>
                    <div className="h-32 overflow-y-auto w-12 border border-gray-150 dark:border-white/15 rounded-[5px] p-0.5 custom-scrollbar flex flex-col gap-0.5">
                      {hours.map((h) => {
                        const isHourSelected = tempHour === h;
                        return (
                          <button
                            key={`hr-${h}`}
                            type="button"
                            onClick={() => handleTimeChange("hour", h)}
                            className={`w-full py-1 text-xs text-center rounded-[5px] transition-all ${isHourSelected
                              ? "bg-primary/15 text-primary font-bold dark:bg-primary/25 dark:text-white"
                              : "text-dark-blue dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                              }`}
                          >
                            {String(h).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minutes column */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/60 mb-1">Phút</span>
                    <div className="h-32 overflow-y-auto w-12 border border-gray-150 dark:border-white/15 rounded-[5px] p-0.5 custom-scrollbar flex flex-col gap-0.5">
                      {minutes.map((m) => {
                        const isMinuteSelected = tempMinute === m;
                        return (
                          <button
                            key={`min-${m}`}
                            type="button"
                            onClick={() => handleTimeChange("minute", m)}
                            className={`w-full py-1 text-xs text-center rounded-[5px] transition-all ${isMinuteSelected
                              ? "bg-primary/15 text-primary font-bold dark:bg-primary/25 dark:text-white"
                              : "text-dark-blue dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                              }`}
                          >
                            {String(m).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AM/PM Switcher */}
                  <div className="flex flex-col items-center pl-1 justify-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/60 mb-2">Buổi</span>
                    <div className="flex flex-col gap-0.5 bg-gray-100 dark:bg-white/5 p-0.5 rounded-[5px] border border-gray-150 dark:border-white/15">
                      <button
                        type="button"
                        onClick={() => handleTimeChange("ampm", "AM")}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-[5px] transition-all ${tempAmPm === "AM"
                          ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-white"
                          : "text-gray-navy dark:text-light-blue/70 hover:text-dark-blue dark:hover:text-white"
                          }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeChange("ampm", "PM")}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-[5px] transition-all ${tempAmPm === "PM"
                          ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-white"
                          : "text-gray-navy dark:text-light-blue/70 hover:text-dark-blue dark:hover:text-white"
                          }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row (Span across the full width, clean border) */}
            <div className="mt-4 border-t border-gray-100 dark:border-white/5 pt-3 flex items-center justify-between w-full">
              <button
                type="button"
                onClick={setToday}
                className="text-xs font-bold text-primary hover:underline"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-sm hover:bg-primary/95 transition-all shadow-sm shadow-primary/20 flex items-center gap-1"
              >
                <Check className="size-3.5" /> Lưu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
