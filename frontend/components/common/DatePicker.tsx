"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: Date;
  error?: string;
}

function toDateOnly(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(iso: string) {
  const d = toDateOnly(iso);
  if (!d) return "Select a date";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function toISODate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day, 10, 0, 0)); // fix at 10:00 UTC to match sample data
  return d.toISOString();
}

export default function DatePicker({ value, onChange, label, minDate, error }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = toDateOnly(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let day = 1 - firstDayOfMonth;
  while (day <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day >= 1 && day <= daysInMonth ? day : null);
      day++;
    }
    weeks.push(week);
  }

  const isDisabled = (d: number) => {
    if (!minDate) return false;
    return new Date(year, month, d) < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  const isSelected = (d: number) =>
    !!selected &&
    selected.getFullYear() === year &&
    selected.getMonth() === month &&
    selected.getDate() === d;

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? "border-red-400" : "border-neutral-300"
        }`}
      >
        <span className={selected ? "text-neutral-800" : "text-neutral-400"}>
          {formatDisplay(value)}
        </span>
        <Calendar className="h-4 w-4 text-neutral-400" />
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <div className="absolute z-20 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="rounded p-1 hover:bg-neutral-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-neutral-700">
              {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="rounded p-1 hover:bg-neutral-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-400">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((d, di) => (
                <button
                  key={di}
                  type="button"
                  disabled={d === null || isDisabled(d)}
                  onClick={() => {
                    if (d === null) return;
                    onChange(toISODate(year, month, d));
                    setOpen(false);
                  }}
                  className={`h-8 w-8 rounded-full text-sm transition ${
                    d === null
                      ? "invisible"
                      : isSelected(d)
                      ? "bg-indigo-600 text-white"
                      : isDisabled(d)
                      ? "cursor-not-allowed text-neutral-300"
                      : "text-neutral-700 hover:bg-indigo-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}