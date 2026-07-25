"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, MessageSquare, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackSuggestionsModal({ isOpen, onClose }: FeedbackSuggestionsModalProps) {
  const [mounted, setMounted] = useState(false);

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-gray-150 dark:border-white/10 bg-white dark:bg-[#1A263B] shadow-2xl transition-all duration-300 animate-in zoom-in-95 fade-in duration-200 text-left">

        {/* Top Accent Gradient Line */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-blue-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-navy/50 hover:text-gray-navy dark:text-light-blue/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 z-10"
        >
          <X className="size-5" />
        </button>

        <div className="p-6 sm:p-8 md:p-10 space-y-6">
          {/* Header */}
          <div className="space-y-2 max-w-xl pr-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Sparkles className="size-3.5" />
              <span>Chào mừng bạn đến với trang phản hồi!</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-dark-blue dark:text-white tracking-tight">
              Đừng ngần ngại đóng góp ý kiến nhé!
            </h2>
            <p className="text-xs sm:text-sm text-gray-navy/70 dark:text-light-blue/60 leading-relaxed">
              Ý kiến của bạn sẽ là một đóng góp vô cùng lớn đến sự phát triển của Quiz DUT AI.
            </p>
          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature Suggestion */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 dark:bg-emerald-500/[0.01] dark:border-emerald-500/5 transition-all hover:scale-[1.02] duration-250">
              <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Lightbulb className="size-4.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Đề xuất tính năng
                </h4>
                <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 leading-relaxed">
                  Bạn muốn hệ thống có thêm tính năng mới? Hãy chia sẻ các ý tưởng độc đáo của bạn.
                </p>
              </div>
            </div>

            {/* Bug Report */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 dark:bg-amber-500/[0.01] dark:border-amber-500/5 transition-all hover:scale-[1.02] duration-250">
              <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="size-4.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Báo cáo lỗi
                </h4>
                <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 leading-relaxed">
                  Phát hiện lỗi hiển thị, lỗi logic hay tính toán? Hãy đăng chi tiết kèm ảnh chụp.
                </p>
              </div>
            </div>

            {/* Experience Feedback */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 dark:bg-blue-500/[0.01] dark:border-blue-500/5 transition-all hover:scale-[1.02] duration-250">
              <div className="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <MessageSquare className="size-4.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Góp ý trải nghiệm
                </h4>
                <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 leading-relaxed">
                  Giao diện khó dùng, tốc độ tải chậm hay thao tác rườm rà? Góp ý để chúng tôi cải thiện.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={onClose}
              className="rounded-xl px-6 h-10 text-xs font-black shadow-md bg-primary hover:bg-primary/95 text-white"
            >
              Bắt đầu đóng góp ý kiến
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
