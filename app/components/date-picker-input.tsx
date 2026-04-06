/**
 * Shared date picker input with a Calendar icon overlay.
 *
 * Used in both the project list and session list custom date range
 * filters.  The Calendar icon acts as a clickable trigger that opens
 * the browser's native date picker via `showPicker()`.
 */
"use client";

import { Calendar } from "lucide-react";

interface DatePickerInputProps {
  id: string;
  /** Date object — converted to YYYY-MM-DD via toISOString (UTC). */
  value: Date | null;
  /** Optional string value (YYYY-MM-DD) — avoids UTC conversion issues. Takes precedence over `value`. */
  stringValue?: string | null;
  onChange: (value: string) => void;
  "aria-label"?: string;
}

export default function DatePickerInput({
  id,
  value,
  stringValue,
  onChange,
  "aria-label": ariaLabel,
}: DatePickerInputProps) {
  const inputValue = stringValue != null ? stringValue : (value ? value.toISOString().split("T")[0] : "");
  return (
    <div className="relative group">
      <input
        type="date"
        id={id}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="date-input px-3 py-2 pr-8 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all hover:border-primary/50 w-[200px]"
      />
      <label
        htmlFor={id}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-10 p-1 rounded hover:bg-muted/50 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          const input = document.getElementById(id) as HTMLInputElement;
          if (input && typeof input.showPicker === "function") {
            input.showPicker();
          } else {
            input?.click();
          }
        }}
      >
        <Calendar className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
      </label>
    </div>
  );
}
