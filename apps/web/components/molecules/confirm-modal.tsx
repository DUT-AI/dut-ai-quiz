"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
  variant = "info",
  isLoading = false,
}: ConfirmModalProps) {
  // Style configurations
  const colorMap = {
    danger: {
      icon: <Trash2 className="size-6 text-red" />,
      iconBg: "bg-red/10 dark:bg-red/20",
      confirmBtn: "bg-red hover:bg-red/90 text-white shadow-lg shadow-red/25",
    },
    warning: {
      icon: <AlertTriangle className="size-6 text-amber-500" />,
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
      confirmBtn: "bg-amber-500 hover:bg-amber-500/90 text-white shadow-lg shadow-amber-500/25",
    },
    info: {
      icon: <Info className="size-6 text-primary" />,
      iconBg: "bg-primary/10 dark:bg-primary/20",
      confirmBtn: "bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/25",
    },
  };

  const selected = colorMap[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-navy-blue w-full max-w-md rounded-[24px] md:rounded-[32px] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/10 p-6 md:p-8 text-center"
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="size-5 text-gray-navy dark:text-light-blue/70" />
            </button>

            <div className="flex flex-col items-center">
              {/* Icon container */}
              <div className={`size-12 md:size-14 rounded-2xl ${selected.iconBg} flex items-center justify-center mb-5 shrink-0`}>
                {selected.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-bold text-dark-blue dark:text-white mb-2 px-2">
                {title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-navy dark:text-light-blue/80 leading-relaxed mb-6 px-1 whitespace-pre-line">
                {description}
              </p>

              {/* Buttons */}
              <div className="flex w-full gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="flex-1 py-5 md:py-6 rounded-xl md:rounded-2xl font-bold dark:text-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5"
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={onConfirm}
                  className={`flex-1 py-5 md:py-6 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${selected.confirmBtn}`}
                >
                  {isLoading ? (
                    <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : null}
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
