"use client";

import React, { useState, useEffect, useMemo } from "react";
import { renderTheoryMarkdown } from "../utils/theory-parser/index";
import { TheoryEmptyState } from "./theory-empty-state";
import { TheoryContent } from "./theory-content";
import { TableOfContents } from "./table-of-contents";

interface TheoryTabProps {
  contentMd?: string | null;
}

export function TheoryTab({ contentMd }: TheoryTabProps) {
  const [activeId, setActiveId] = useState<string>("");

  const { html, headings } = useMemo(() => {
    return renderTheoryMarkdown(contentMd || "");
  }, [contentMd]);

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
    return <TheoryEmptyState />;
  }

  const showTOC = headings.length > 0;

  return (
    <div className="relative">
      <TheoryContent html={html} />

      {showTOC && (
        <TableOfContents
          headings={headings}
          activeId={activeId}
          onHeadingClick={scrollToHeading}
        />
      )}
    </div>
  );
}
