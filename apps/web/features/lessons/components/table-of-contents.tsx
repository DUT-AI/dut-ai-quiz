"use client";

import React, { useState, useEffect } from "react";
import { List, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    headings: HeadingItem[];
    activeId: string;
    onHeadingClick: (id: string) => void;
}

export function TableOfContents({ headings, activeId, onHeadingClick }: TableOfContentsProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [cardTop, setCardTop] = useState(180);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsOpen(window.innerWidth >= 1024);
            setCardTop(window.innerWidth >= 1024 ? 180 : 120);
        }
    }, []);

    const handleDrag = (event: any, info: any) => {
        setCardTop((prev) => {
            const nextTop = prev + info.delta.y;
            const minTop = 80; // top limit (below header)
            const maxTop = window.innerHeight - 200; // bottom limit (minimum height)
            if (nextTop < minTop) return minTop;
            if (nextTop > maxTop) return maxTop;
            return nextTop;
        });
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed right-4 lg:right-8 bottom-6 lg:top-[220px] lg:bottom-auto z-40 flex 
              items-center gap-2 px-4 py-3 rounded-full bg-primary text-white border border-primary/20 
              shadow-xl hover:shadow-2xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all 
              font-bold text-[16px] cursor-pointer"
                    >
                        <List className="size-4" />
                        <span>Mục lục</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Table of Contents Resizable Card */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 250 }}
                        className="fixed right-4 lg:right-8 z-40 w-[300px] sm:w-[350px] flex flex-col rounded-3xl bg-white/95 dark:bg-[#121E31]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
                        style={{
                            top: `${cardTop}px`,
                            bottom: "80px"
                        }}
                    >
                        {/* Drag Handle Pill */}
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0}
                            dragMomentum={false}
                            onDrag={handleDrag}
                            className="flex justify-center pt-2.5 pb-1 bg-slate-50/50 dark:bg-white/[0.02] cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 opacity-80" />
                        </motion.div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 pt-1 border-b border-gray-150 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                            <motion.div
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={0}
                                dragMomentum={false}
                                onDrag={handleDrag}
                                className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none flex-1"
                            >
                                <List className="size-4 text-primary" />
                                <span className="font-black text-[15px] text-dark-blue dark:text-white uppercase tracking-wider">
                                    Mục lục bài học
                                </span>
                            </motion.div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-gray-navy dark:text-light-blue hover:text-dark-blue dark:hover:text-white transition-all cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* List items */}
                        <div
                            className="overflow-y-auto flex-1 py-4 px-6 space-y-1 text-left"
                            style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(156, 163, 175, 0.3) transparent",
                            }}
                        >
                            {headings.map((heading) => {
                                const isActive = activeId === heading.id;
                                return (
                                    <button
                                        key={heading.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onHeadingClick(heading.id);
                                            if (window.innerWidth < 1024) {
                                                setIsOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            "w-full text-left py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer block truncate",
                                            heading.level === 1 && "font-extrabold text-[19px]",
                                            heading.level === 2 && "pl-5 font-medium text-[18px]",
                                            heading.level === 3 && "pl-10 font-medium text-[18px]",
                                            heading.level === 4 && "pl-15 font-medium text-[18px] italic opacity-80",
                                            isActive
                                                ? "text-primary font-bold bg-primary/5 dark:bg-primary/10 border-l-2 border-primary"
                                                : "text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5 border-l border-transparent"
                                        )}
                                        title={heading.text}
                                    >
                                        {heading.text}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
