"use client";

import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { darkMode } = useThemeStore();
  const pathname = usePathname();
  const isPracticeGame = pathname && pathname.includes("/practice") && pathname !== "/lessons/practice";

  return (
    <div className={cn(
      darkMode && "dark",
      isPracticeGame
        ? "h-auto w-full overflow-visible transition-all"
        : "xs:min-h-screen lg:h-full w-full lg:overflow-hidden transition-all",
    )}>
      {children}
    </div>
  );
};

export default ThemeProvider;