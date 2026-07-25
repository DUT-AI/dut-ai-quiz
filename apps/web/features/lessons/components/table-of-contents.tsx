"use client";

import React, { useState, useEffect } from "react";
import { List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { HeadingItem } from "../utils/theory-parser";
import { TocMinimized } from "./toc-minimized";
import { TocExpanded } from "./toc-expanded";

interface TableOfContentsProps {
  headings: HeadingItem[];
  activeId: string;
  onHeadingClick: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function TableOfContents({
  headings,
  activeId,
  onHeadingClick,
  isOpen,
  setIsOpen,
}: TableOfContentsProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMobileHeadingClick = (id: string) => {
    onHeadingClick(id);
    setIsOpen(false);
  };

  if (!headings || headings.length === 0) return null;

  if (isDesktop) {
    // Desktop layout: Hover to expand Notion-style TOC
    return (
      <div
        className="fixed right-4 lg:right-6 top-[220px] z-40 flex justify-end"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          layout
          initial={false}
          animate={{
            width: isHovered ? 280 : 44,
            borderRadius: isHovered ? 8 : 22,
            backgroundColor: isHovered
              ? "var(--bg-popover, rgb(255 255 255))"
              : "var(--bg-minimized, rgba(241, 245, 249, 0.5))",
            boxShadow: isHovered
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)"
              : "0 0px 0px rgba(0, 0, 0, 0)",
            borderWidth: isHovered ? 1 : 0,
            borderColor: "rgba(226, 232, 240, 0.8)",
          }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 33,
          }}
          className={cn(
            "overflow-hidden border select-none transition-colors duration-200 backdrop-blur-md",
            isHovered
              ? "bg-white dark:bg-[#191919] border-[#e9e9e7] dark:border-[#2f2f2f]"
              : "bg-slate-100/50 dark:bg-zinc-800/10 border-transparent dark:border-transparent"
          )}
        >
          <motion.div layout className="w-full h-full">
            {isHovered ? (
              <TocExpanded
                headings={headings}
                activeId={activeId}
                onHeadingClick={onHeadingClick}
              />
            ) : (
              <TocMinimized
                headings={headings}
                activeId={activeId}
                onHeadingClick={onHeadingClick}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Mobile layout: Floating trigger button, opens full drawer on click
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-4 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-white border border-primary/20 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all font-bold text-[15px] cursor-pointer"
          >
            <List className="size-4" />
            <span>Mục lục</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Modal Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 z-40 mx-4 my-6 flex flex-col rounded-xl bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xl overflow-hidden"
          >
            <TocExpanded
              headings={headings}
              activeId={activeId}
              onHeadingClick={handleMobileHeadingClick}
              showCloseButton
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

