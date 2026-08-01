"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Filter } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface LessonFilterProps {
  lessons: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function LessonFilter({ lessons, selectedId, onChange }: LessonFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLesson = lessons.find((l) => l.id === selectedId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full md:w-[260px] text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between gap-2.5 rounded-xl border border-gray-250 bg-white px-3.5 py-2 text-sm font-medium text-dark-blue outline-none transition-all hover:bg-gray-50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-900/60 dark:text-white dark:hover:bg-zinc-900"
      >
        <span className="flex items-center gap-2 truncate">
          <Filter className="size-4 flex-shrink-0 text-gray-navy dark:text-light-blue" />
          <span className="truncate">
            {selectedLesson ? selectedLesson.name : "Lọc theo bài học"}
          </span>
        </span>
        <ChevronDown
          className={`size-4 text-gray-navy transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-1.5 max-h-64 w-full min-w-[280px] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-zinc-900 custom-scrollbar"
          >
            {/* Reset option */}
            <button
              type="button"
              onClick={() => handleSelect("")}
              className="flex w-full items-center justify-between px-3.5 py-2 text-sm transition-colors hover:bg-gray-100 text-dark-blue dark:text-white dark:hover:bg-white/5"
            >
              <span className={!selectedId ? "font-bold text-primary" : ""}>
                Tất cả bài học
              </span>
              {!selectedId && <Check className="size-4 text-primary" />}
            </button>

            {lessons.map((lesson) => {
              const isSelected = lesson.id === selectedId;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => handleSelect(lesson.id)}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-sm transition-colors hover:bg-gray-100 text-dark-blue dark:text-white dark:hover:bg-white/5"
                >
                  <span className={`truncate ${isSelected ? "font-bold text-primary" : ""}`}>
                    {lesson.name}
                  </span>
                  {isSelected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
