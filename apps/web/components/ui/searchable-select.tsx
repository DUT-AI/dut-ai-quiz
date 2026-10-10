"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  badge?: string | number;
  description?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  leadingIcon?: React.ReactNode;
  allOptionLabel?: string;
  allOptionCount?: number;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Tìm kiếm...",
  leadingIcon,
  allOptionLabel,
  allOptionCount,
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected option details
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Options including "All" option if requested
  const fullOptionsList = useMemo(() => {
    const list: SearchableOption[] = [];
    if (allOptionLabel) {
      list.push({
        value: "",
        label: allOptionLabel,
        badge: allOptionCount !== undefined ? `${allOptionCount} bài` : undefined,
      });
    }
    return [...list, ...options];
  }, [options, allOptionLabel, allOptionCount]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return fullOptionsList;
    const query = search.toLowerCase().trim();
    return fullOptionsList.filter((opt) =>
      opt.label.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [fullOptionsList, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      e.preventDefault();
      const selected = filteredOptions[highlightedIndex];
      if (selected) {
        onChange(selected.value);
        setIsOpen(false);
      }
    }
  };

  const currentDisplayLabel = useMemo(() => {
    if (value === "" && allOptionLabel) {
      return allOptionCount !== undefined ? `${allOptionLabel} (${allOptionCount} bài)` : allOptionLabel;
    }
    if (selectedOption) {
      return selectedOption.label;
    }
    return placeholder;
  }, [value, allOptionLabel, allOptionCount, selectedOption, placeholder]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block text-left select-none", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-4 py-3.5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs text-dark-blue dark:text-white cursor-pointer group text-left",
          isOpen && "ring-2 ring-primary/30 border-primary/40 bg-white dark:bg-navy-blue shadow-sm",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {leadingIcon && (
            <span className="text-gray-navy opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {leadingIcon}
            </span>
          )}
          <span
            className={cn(
              "truncate",
              !value && !allOptionLabel && "text-gray-navy opacity-50 font-medium"
            )}
            title={currentDisplayLabel}
          >
            {currentDisplayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {value !== "" && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-full text-gray-navy opacity-40 hover:opacity-100 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              title="Xóa lựa chọn"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-gray-navy opacity-40 group-hover:opacity-80 transition-transform duration-200",
              isOpen && "rotate-180 text-primary opacity-100"
            )}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[280px] max-w-[380px] z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 shadow-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-navy opacity-40" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-dark-blue dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-navy opacity-50 hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-[260px] overflow-y-auto space-y-0.5 custom-scrollbar px-1 py-0.5"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-navy dark:text-light-blue/60">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    type="button"
                    key={opt.value || "__all__"}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : isHighlighted
                        ? "bg-gray-100 dark:bg-white/10 text-dark-blue dark:text-white"
                        : "text-dark-blue dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <p className={cn("truncate", isSelected && "text-primary font-bold")}>
                          {opt.label}
                        </p>
                        {opt.description && (
                          <p className="text-[10px] text-gray-navy opacity-60 truncate">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-navy dark:text-light-blue/70">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="size-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
