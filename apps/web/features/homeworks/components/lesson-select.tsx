"use client";

import { GraduationCap } from "lucide-react";
import React from "react";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

interface LessonSelectProps {
  lessons: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function LessonSelect({
  lessons,
  selectedId,
  onChange,
  placeholder = "Chọn bài học chứa bài tập coding",
}: LessonSelectProps) {
  const options = lessons.map((l) => ({ value: l.id, label: l.name }));
  
  // Include the placeholder reset option at the top of the list if lessons exist
  const dropdownOptions = lessons.length > 0 
    ? [{ value: "", label: placeholder }, ...options]
    : [];

  return (
    <FilterDropdown
      value={selectedId}
      onChange={onChange}
      options={dropdownOptions}
      placeholder={placeholder}
      icon={GraduationCap}
      className="w-full text-left"
      triggerClassName="h-11 bg-gray-50 hover:bg-gray-100/50 px-4 text-sm font-medium dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60 dark:border-white/10"
    />
  );
}
