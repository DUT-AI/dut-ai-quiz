"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: "blue" | "green" | "primary" | "orange";
}

export function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    primary: "bg-primary/10 text-primary",
    orange: "bg-orange/10 text-orange",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-6"
    >
      <div className={cn("size-14 rounded-2xl flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="size-7" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-navy opacity-40 mb-1">{label}</p>
        <p className="text-2xl font-black text-dark-blue dark:text-white leading-none">{value}</p>
      </div>
    </motion.div>
  );
}
