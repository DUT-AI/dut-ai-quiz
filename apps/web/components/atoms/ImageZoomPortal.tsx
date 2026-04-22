"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ImageZoomPortal() {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.classList.contains("clickable-img")) {
        setSelectedImg((target as HTMLImageElement).src);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {selectedImg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-12"
          onClick={() => setSelectedImg(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-8 right-8 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 z-[10000]"
            onClick={(e) => {
                e.stopPropagation();
                setSelectedImg(null);
            }}
          >
            <X size={24} />
          </button>

          {/* Hint */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/10 text-white/50 text-xs font-black uppercase tracking-widest pointer-events-none">
             Bấm vào bất kỳ đâu để đóng
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImg}
              alt="Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
