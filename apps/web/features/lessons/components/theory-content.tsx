"use client";

import React from "react";

interface TheoryContentProps {
    html: string;
}

export const TheoryContent = React.memo(function TheoryContent({ html }: TheoryContentProps) {
    return (
        <div className="bg-white dark:bg-[#121E31]/90 border border-gray-200 dark:border-white/20 rounded-[2.5rem] shadow-xl p-8 md:p-12 text-left">
            <div
                className="max-w-4xl mx-auto text-left font-sans antialiased text-dark-blue dark:text-white break-words"
                dangerouslySetInnerHTML={{
                    __html: html,
                }}
            />
        </div>
    );
});