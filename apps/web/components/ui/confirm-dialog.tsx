"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  description = "Bạn có chắc chắn muốn thực hiện hành động này không? Hành động này không thể hoàn tác.",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDestructive = true,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Disable scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Dialog Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-gray-150 dark:border-white/10 bg-white dark:bg-[#1A263B] shadow-2xl transition-all duration-300 animate-in zoom-in-95 fade-in duration-200">

        {/* Top Accent Gradient Line */}
        <div className={`h-1.5 w-full ${isDestructive ? 'bg-gradient-to-r from-red to-orange-500' : 'bg-gradient-to-r from-primary to-indigo-500'}`} />

        <div className="p-6">
          <div className="flex flex-col items-center text-center">

            {/* Warning Icon Container */}
            <div className={`flex size-14 items-center justify-center rounded-2xl mb-4 transition-all duration-300 shadow-md ${isDestructive
              ? 'bg-red/10 text-red shadow-red/5'
              : 'bg-primary/10 text-primary shadow-primary/5'
              }`}>
              <AlertTriangle className="size-6 animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-dark-blue dark:text-white leading-6 mb-2">
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-navy/70 dark:text-light-blue/70 mb-6 max-w-sm leading-relaxed">
              {description}
            </p>

            {/* Actions */}
            <div className="flex w-full flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="h-10 w-full sm:w-auto rounded-xl border-gray-250 dark:border-white/10 text-xs font-bold transition-all duration-200"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className={`h-10 w-full sm:w-auto rounded-xl text-xs font-black shadow-md text-white transition-all duration-200 ${isDestructive
                  ? 'bg-red hover:bg-red/90 shadow-red/10'
                  : 'bg-primary hover:bg-primary/90 shadow-primary/10'
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Đang xử lý...
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
