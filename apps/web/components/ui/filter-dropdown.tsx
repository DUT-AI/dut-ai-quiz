"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  triggerClassName?: string;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  placeholder = "Chọn",
  icon: Icon,
  className,
  triggerClassName,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative text-left w-full sm:w-auto", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2.5 rounded-xl border border-gray-250 bg-white px-3.5 py-2 text-xs font-bold text-dark-blue outline-none transition-all hover:bg-gray-50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-900/80",
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="size-3.5 flex-shrink-0 text-gray-navy dark:text-light-blue/70" />}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-gray-navy transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute left-0 sm:right-0 z-50 mt-1.5 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-zinc-900 custom-scrollbar"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-navy text-center">
                Không có lựa chọn nào
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-xs text-left transition-colors hover:bg-gray-100 text-dark-blue dark:text-white dark:hover:bg-white/5"
                  >
                    <span className={isSelected ? "font-bold text-primary" : ""}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="size-3.5 text-primary" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
