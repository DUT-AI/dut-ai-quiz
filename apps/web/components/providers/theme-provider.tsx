"use client";

import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import React, { ReactNode, useEffect } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { darkMode } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

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