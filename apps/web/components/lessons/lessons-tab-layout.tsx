"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Swords, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LessonsTabLayoutProps {
  children: React.ReactNode;
  activeTab: "content" | "practice" | "mockexam";
}

export function LessonsTabLayout({ children, activeTab }: LessonsTabLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: "content",
      label: "Nội dung bài học",
      href: "/lessons/content",
      icon: BookOpen,
    },
    {
      id: "practice",
      label: "Luyện tập",
      href: "/lessons/practice",
      icon: Swords,
    },
    {
      id: "mockexam",
      label: "Thi thử",
      href: "/lessons/mockexam",
      icon: Trophy,
    },
  ] as const;

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white">
          Học tập & <span className="text-primary">Khám phá</span>
        </h1>
        <p className="text-gray-navy dark:text-light-blue mt-2">
          Hệ thống lộ trình bài học giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-150 dark:border-white/10 gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all duration-200 text-nowrap rounded-t-2xl pb-4 border-b-2 border-transparent",
                isActive
                  ? "text-primary border-primary"
                  : "text-gray-navy dark:text-light-blue hover:text-primary opacity-70 hover:opacity-100"
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
