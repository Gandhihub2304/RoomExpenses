"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthPicker({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  function goPrev() {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  }

  function goNext() {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card px-1 py-1">
      <Button variant="ghost" size="icon-sm" onClick={goPrev} aria-label="Previous month">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={goNext}
        disabled={isCurrentMonth}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
