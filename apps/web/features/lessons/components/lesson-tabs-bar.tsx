"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code2, Swords, ListRestart, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LessonTabsBarProps {
  slug: string;
  isPreview?: boolean;
}

export function LessonTabsBar({ slug, isPreview = false }: LessonTabsBarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isFullyOpen, setIsFullyOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const querySuffix = isPreview ? "?preview=true" : "";
  const basePath = `/lessons/${slug}`;

  const tabItems = [
    {
      id: "theory",
      label: "Lý thuyết",
      icon: BookOpen,
      href: `${basePath}${querySuffix}`,
      isActive: pathname === basePath || pathname === `${basePath}/`,
    },
    {
      id: "practice",
      label: "Luyện tập",
      icon: ListRestart,
      href: `${basePath}/practice${querySuffix}`,
      isActive: pathname === `${basePath}/practice` || pathname.startsWith(`${basePath}/practice/`),
    },
    {
      id: "arena",
      label: "Luyện tập thi đấu",
      icon: Swords,
      href: `${basePath}/arena${querySuffix}`,
      isActive: pathname === `${basePath}/arena` || pathname.startsWith(`${basePath}/arena/`),
    },
    {
      id: "homework",
      label: "Bài tập coding",
      icon: Code2,
      href: `${basePath}/homework${querySuffix}`,
      isActive: pathname === `${basePath}/homework` || pathname.startsWith(`${basePath}/homework/`),
    },
  ] as const;

  const activeTabItem = tabItems.find((t) => t.isActive) || tabItems[0];

  const handleTabClick = () => {
    setIsMobileExpanded(false);
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 100);
    };

    mainEl.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMobileExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileExpanded]);

  const isOpen = isHovered || isMobileExpanded;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsFullyOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsFullyOpen(false);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          setIsHovered(false);
        }
      }}
      className={cn(
        "sticky top-0 z-30 transition-transform duration-300 ease-in-out",
        isScrolled ? "!mt-0 -mx-4 sm:-mx-5 md:-mx-6 xl:-mx-8" : ""
      )}
      style={{
        transform: isScrolled
          ? isOpen
            ? "translateY(0)"
            : "translateY(calc(-100% + 6px))"
          : "translateY(0)",
      }}
    >
      {/* Scrollable tabs bar container */}
      <div
        className={cn(
          "w-full flex border-b border-gray-150 dark:border-white/10 gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth transition-all duration-300",
          isScrolled
            ? "bg-slate-50/80 dark:bg-zinc-950/20 pt-3 px-4 sm:px-5 md:px-6 xl:px-8"
            : "pt-0 px-0"
        )}
        style={{
          backgroundColor: isScrolled ? undefined : "transparent",
          backdropFilter: isScrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(16px)" : "none",
        }}
      >
        {tabItems.map((tab) => {
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={handleTabClick}
              className={cn(
                "relative flex items-center gap-2 transition-all duration-200 text-nowrap border-b-2 border-transparent font-black",
                isScrolled
                  ? "px-5 py-2.5 text-xs sm:text-sm rounded-t-xl pb-2.5"
                  : "px-6 py-4 text-sm rounded-t-2xl pb-4",
                tab.isActive
                  ? "text-primary"
                  : "text-gray-navy dark:text-light-blue hover:text-primary opacity-70 hover:opacity-100"
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {tab.isActive && (
                <motion.div
                  layoutId="lesson-active-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Floating Pill Handle when collapsed on mobile/scroll */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) {
            setIsMobileExpanded(!isMobileExpanded);
          }
        }}
        className={cn(
          "absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full flex items-center gap-1.5 px-4 py-1.5 rounded-b-2xl border-x border-b border-gray-150 dark:border-white/15 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-md text-xs font-black text-primary cursor-pointer transition-[opacity,transform] duration-300 ease-in-out whitespace-nowrap outline-none focus:outline-none",
          isScrolled
            ? isOpen
              ? isFullyOpen
                ? "opacity-0 scale-0 pointer-events-none"
                : "opacity-0 scale-100 pointer-events-auto"
              : "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-0 pointer-events-none"
        )}
      >
        {activeTabItem && (
          <>
            <activeTabItem.icon className="size-3.5 pointer-events-none" />
            <span className="pointer-events-none">{activeTabItem.label}</span>
          </>
        )}
        <ChevronDown className="size-3 pointer-events-none" />
      </button>
    </div>
  );
}
