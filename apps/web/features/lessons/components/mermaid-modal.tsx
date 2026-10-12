"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw, Copy, Check } from "lucide-react";

interface MermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgHtml: string;
  code: string;
}

export const MermaidModal: React.FC<MermaidModalProps> = ({
  isOpen,
  onClose,
  svgHtml,
  code,
}) => {
  // Giá trị khởi tạo là 150% (1.5)
  const [scale, setScale] = useState(1.5);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScale(1.5);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  const handleZoomOut = () => setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  const handleResetZoom = () => setScale(1.5);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 dark:bg-black/75 backdrop-blur-md p-2 md:p-3.5 select-none"
        >
          {/* Header Controls Bar */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between w-full max-w-[98vw] mx-auto py-2.5 px-4 bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl mb-2 md:mb-3 z-10"
          >
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 text-xs md:text-sm font-semibold tracking-wide text-slate-800 dark:text-zinc-200">
                Mermaid Diagram Viewer
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-slate-200 dark:border-zinc-700/60 mr-1 md:mr-2">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  title="Zoom Out"
                  className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset Zoom (150%)"
                  className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  <span>{Math.round(scale * 100)}%</span>
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 4}
                  title="Zoom In"
                  className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy Code</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-rose-500/15 hover:text-rose-500 rounded-xl transition-colors cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Diagram Content Canvas - Background màu xám trang nhã (không màu đen), mở rộng tràn viền 98vw */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 w-full max-w-[98vw] min-h-0 mx-auto overflow-auto theory-scrollbar rounded-2xl bg-slate-100/95 dark:bg-[#1E293B]/95 border border-slate-300/80 dark:border-zinc-700/80 p-4 md:p-8 flex items-center justify-center shadow-2xl relative"
          >
            <div
              style={{
                transform: `scale(${scale * 1.9})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
              className="min-w-max min-h-max m-auto flex items-center justify-center [&_svg]:max-w-none [&_svg]:h-auto [&_svg_foreignObject]:overflow-visible [&_svg_.edgeLabel]:overflow-visible [&_svg_.edgeLabel_p]:whitespace-nowrap [&_svg_.edgeLabel_span]:whitespace-nowrap font-sans"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
