"use client";

import React from "react";
import { Markdown } from "@/components/markdown";

interface TheoryContentProps {
  contentMd: string;
}

export const TheoryContent = React.memo(function TheoryContent({ contentMd }: TheoryContentProps) {
  return (
    <div className="bg-white dark:bg-[#121E31]/90 border border-gray-200 dark:border-white/20 rounded-[2.5rem] shadow-xl pt-6 pb-6 px-6 md:pt-16 md:pb-14 md:px-12 text-left transition-colors duration-300">
      <div className="max-w-5xl mx-auto text-left font-sans antialiased text-dark-blue dark:text-white break-words">
        <Markdown content={contentMd} />
      </div>
    </div>
  );
});