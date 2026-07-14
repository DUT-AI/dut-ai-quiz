"use client";

import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import React, { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { darkMode } = useThemeStore();

  return (
    <div className={cn(
      darkMode && "dark",
      "min-h-screen w-full transition-all"
    )}>
      {children}
    </div>
  );
};

export default ThemeProvider;