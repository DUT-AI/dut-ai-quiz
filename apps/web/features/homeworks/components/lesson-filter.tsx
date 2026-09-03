"use client";

import { Filter } from "lucide-react";
import React from "react";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

interface LessonFilterProps {
  lessons: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function LessonFilter({ lessons, selectedId, onChange }: LessonFilterProps) {
  const options = [
    { value: "", label: "Tất cả bài học" },
    ...lessons.map((l) => ({ value: l.id, label: l.name }))
  ];

  return (
    <FilterDropdown
      value={selectedId}
      onChange={onChange}
      options={options}
      placeholder="Lọc theo bài học"
      icon={Filter}
      className="w-full md:w-[260px]"
    />
  );
}
