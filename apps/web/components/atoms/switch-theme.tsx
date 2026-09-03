"use client";

import { useThemeTransition } from "@/hooks/use-theme-transition";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

const SwitchTheme = () => {
  const { darkMode, toggleWithTransition } = useThemeTransition();

  return (
    <motion.button
      onClick={toggleWithTransition}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center size-10 md:size-12 rounded-xl border border-gray-200 bg-white text-slate-800 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:outline-none dark:border-white/10 dark:bg-navy-blue dark:text-white dark:hover:bg-white/5"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ rotate: darkMode ? 360 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        {darkMode ? (
          <Sun className="size-5 md:size-6 text-white fill-white/10" />
        ) : (
          <Moon className="size-5 md:size-6 text-slate-700 fill-slate-700/10" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default SwitchTheme;
