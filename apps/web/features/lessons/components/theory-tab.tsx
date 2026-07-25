"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { extractHeadings } from "../utils/theory-parser";
import { TheoryEmptyState } from "./theory-empty-state";
import { TheoryContent } from "./theory-content";
import { TableOfContents } from "./table-of-contents";

import { LessonComments } from "@/features/comments/components/lesson-comments";

interface TheoryTabProps {
  contentMd?: string | null;
  lessonId: string;
}

export function TheoryTab({ contentMd, lessonId }: TheoryTabProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [shiftAmount, setShiftAmount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const headings = useMemo(() => {
    return extractHeadings(contentMd || "");
  }, [contentMd]);

  // Initialize TOC open state based on screen width
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTocOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Calculate dynamic shift on desktop to prevent overlap
  useEffect(() => {
    if (!isTocOpen || typeof window === "undefined" || window.innerWidth < 1024) {
      setShiftAmount(0);
      return;
    }

    const calculateShift = () => {
      const container = containerRef.current;
      if (!container) return;

      const mainContainer = container.closest("main") || document.documentElement;
      
      const rect = container.getBoundingClientRect();
      const mainRect = mainContainer.getBoundingClientRect();
      
      const leftRelativeToMain = rect.left - mainRect.left;
      const rightRelativeToMain = mainRect.right - rect.right;
      
      // TOC width is 300px, right spacing is 32px (total 332px)
      const tocSpaceNeeded = 300 + 32;
      const overlap = tocSpaceNeeded - rightRelativeToMain;

      if (overlap <= 0) {
        setShiftAmount(0);
        return;
      }

      // Maintain at least a 24px left margin from the right column edge
      const maxShift = leftRelativeToMain - 24;
      
      if (maxShift <= 0) {
        setShiftAmount(0);
        return;
      }

      setShiftAmount(Math.min(overlap, maxShift));
    };

    calculateShift();

    // Listen to resize on main viewport and sidebar changes via ResizeObserver
    const mainContainer = containerRef.current?.closest("main") || document.body;
    const resizeObserver = new ResizeObserver(() => {
      calculateShift();
    });

    resizeObserver.observe(mainContainer);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", calculateShift);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateShift);
    };
  }, [isTocOpen, headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const scrollContainer = document.querySelector("main");
    const container = scrollContainer || window;

    const handleScroll = () => {
      let scrollPosition = 0;
      let containerRect = { top: 0 };

      if (scrollContainer) {
        scrollPosition = scrollContainer.scrollTop + 140; // 140px buffer offset
        containerRect = scrollContainer.getBoundingClientRect();
      } else {
        scrollPosition = window.scrollY + 140;
      }

      let currentActiveId = "";

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const el = document.getElementById(heading.id);
        if (el) {
          let top = 0;
          if (scrollContainer) {
            const elRect = el.getBoundingClientRect();
            top = elRect.top - containerRect.top + scrollContainer.scrollTop;
          } else {
            top = el.getBoundingClientRect().top + window.scrollY;
          }

          if (scrollPosition >= top) {
            currentActiveId = heading.id;
          } else {
            break;
          }
        }
      }

      if (currentActiveId) {
        setActiveId(currentActiveId);
      } else {
        setActiveId(headings[0].id);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger scroll check initially and also with a small timeout to make sure elements are fully rendered/positioned
    handleScroll();
    const timer = setTimeout(handleScroll, 100);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    const scrollContainer = document.querySelector("main");

    if (el) {
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const relativeTop = elRect.top - containerRect.top + scrollContainer.scrollTop;
        const targetScrollTop = relativeTop - 40; // 40px padding/margin at the top

        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      } else {
        const headerOffset = 100;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }

      setActiveId(id);
    }
  };

  if (!contentMd) {
    return (
      <div className="space-y-8">
        <TheoryEmptyState />
        <LessonComments lessonId={lessonId} />
      </div>
    );
  }

  const showTOC = headings.length > 0;

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        style={{
          transform: shiftAmount > 0 ? `translateX(-${shiftAmount}px)` : undefined,
        }}
        className="transition-transform duration-300 ease-in-out"
      >
        <TheoryContent contentMd={contentMd} />
        <LessonComments lessonId={lessonId} />
      </div>

      {showTOC && (
        <TableOfContents
          headings={headings}
          activeId={activeId}
          onHeadingClick={scrollToHeading}
          isOpen={isTocOpen}
          setIsOpen={setIsTocOpen}
        />
      )}
    </div>
  );
}
