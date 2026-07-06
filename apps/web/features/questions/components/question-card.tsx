"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Lightbulb, Edit3, Trash2, Sparkles, Check, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import type { QuestionOut } from "@/lib/types";
import { useAuth } from "@/context/auth-context";

interface QuestionCardProps {
  q: QuestionOut;
  idx: number;
  onExplain: (q: QuestionOut) => void;
  onEdit?: (q: QuestionOut) => void;
  onDelete?: (q: QuestionOut) => void;
}

export const QuestionCard = React.memo(
  ({ q, idx, onExplain, onEdit, onDelete }: QuestionCardProps) => {
    const { user } = useAuth();
    const storageKey = useMemo(() => {
      return `practice_progress_${user?.id || "guest"}_${q.lesson_id || "default"}`;
    }, [user?.id, q.lesson_id]);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    // Load state from localStorage on mount
    React.useEffect(() => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (data[q.id]) {
            setSelectedId(data[q.id].selectedId || null);
            setIsRevealed(data[q.id].isRevealed || false);
          }
        }
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }, [storageKey, q.id]);

    const handleSelect = (optionId: string) => {
      if (isRevealed) return;
      setSelectedId(optionId);
      setIsRevealed(true);

      try {
        const stored = localStorage.getItem(storageKey) || "{}";
        const data = JSON.parse(stored);
        data[q.id] = { selectedId: optionId, isRevealed: true };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save progress", e);
      }
    };

    const handleReset = () => {
      setSelectedId(null);
      setIsRevealed(false);

      try {
        const stored = localStorage.getItem(storageKey) || "{}";
        const data = JSON.parse(stored);
        delete data[q.id];
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to reset progress", e);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
      >
        <Card
          className={cn(
            "border-none shadow-lg bg-white dark:bg-navy-blue/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all border-l-4 text-left",
            isRevealed
              ? q.options.find((o) => o.id === selectedId)?.is_correct
                ? "border-l-green"
                : "border-l-red"
              : "border-l-primary/20"
          )}
        >
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-4 shrink-0">
                <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center font-bold text-gray-navy opacity-50">
                  #{idx + 1}
                </div>

                {/* Reset button removed to prevent re-answering once chosen */}
              </div>

              <div className="flex-1 space-y-8">
                <div className="text-xl font-medium text-dark-blue dark:text-white leading-relaxed select-text">
                  <Markdown content={q.content} />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((opt, i) => {
                    const isSelected = selectedId === opt.id;
                    const isCorrect = opt.is_correct;

                    let statusStyles =
                      "bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-primary/30";
                    if (isRevealed) {
                      if (isCorrect) {
                        statusStyles =
                          "bg-green/10 border-green/30 text-green ring-2 ring-green/20";
                      } else if (isSelected) {
                        statusStyles = "bg-red/10 border-red/30 text-red opacity-100";
                      } else {
                        statusStyles = "opacity-40 grayscale-[0.5]";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isRevealed}
                        onClick={() => handleSelect(opt.id)}
                        className={cn(
                          "group relative w-full px-6 py-4 rounded-2xl border transition-all flex gap-4 items-center text-left",
                          statusStyles,
                          !isRevealed && "active:scale-[0.98] hover:translate-x-1"
                        )}
                      >
                        <div
                          className={cn(
                            "size-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                            isRevealed && isCorrect
                              ? "bg-green text-white"
                              : isSelected && !isCorrect
                                ? "bg-red text-white"
                                : "bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 text-primary"
                          )}
                        >
                          {isRevealed && isCorrect ? (
                            <Check className="size-4" />
                          ) : isSelected && !isCorrect ? (
                            <XCircle className="size-4" />
                          ) : (
                            String.fromCharCode(65 + i)
                          )}
                        </div>
                        <span className="font-medium select-text">
                          <Markdown content={opt.text} />
                        </span>

                        {isSelected && !isRevealed && (
                          <motion.div
                            layoutId="selection"
                            className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isRevealed && q.solution && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                          <Lightbulb className="size-3" />
                          Hướng dẫn chi tiết
                        </h4>
                        <div className="text-dark-blue dark:text-white leading-relaxed font-medium select-text">
                          <Markdown content={q.solution} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  {(onEdit || onDelete) && (
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-navy hover:text-primary hover:bg-primary/5 p-2 rounded-xl transition-all"
                          onClick={() => onEdit(q)}
                        >
                          <Edit3 className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-navy hover:text-red hover:bg-red/5 p-2 rounded-xl transition-all"
                          onClick={() => onDelete(q)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="h-px flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary font-bold flex items-center gap-2 hover:bg-primary/10 px-4 py-2 rounded-2xl"
                    onClick={() => onExplain(q)}
                  >
                    <Sparkles className="size-4" />
                    Xem gợi ý
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

QuestionCard.displayName = "QuestionCard";
