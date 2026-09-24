"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Edit3, Trash2, Sparkles, Check, XCircle, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import { RelatedLessonSchema, type QuestionOut, type RelatedLesson } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { apiGet, apiPost } from "@/lib/api";
import { ReferenceDocumentsModal } from "./reference-documents-modal";

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
    const [result, setResult] = useState<{
      isCorrect: boolean;
      correctOptionId: string;
      solution: string | null;
    } | null>(null);
    const [relatedLessons, setRelatedLessons] = useState<RelatedLesson[]>([]);
    const [showReferences, setShowReferences] = useState(false);

    // Load state from sessionStorage on mount
    React.useEffect(() => {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (data[q.id]) {
            setSelectedId(data[q.id].selectedId || null);
            setIsRevealed(data[q.id].isRevealed || false);
            setResult(data[q.id].result || null);
          }
        }
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }, [storageKey, q.id]);

    React.useEffect(() => {
      if (!isRevealed || q.pool_type !== "PRACTICE") {
        setRelatedLessons([]);
        return;
      }
      let cancelled = false;
      apiGet<RelatedLesson[]>(
        `/api/v1/questions/${q.id}/related-lessons?limit=3`,
        z.array(RelatedLessonSchema)
      )
        .then((lessons) => {
          if (!cancelled) setRelatedLessons(lessons);
        })
        .catch(() => {
          // Answering still works when semantic search is disabled/unavailable.
          if (!cancelled) setRelatedLessons([]);
        });
      return () => {
        cancelled = true;
      };
    }, [isRevealed, q.id, q.pool_type]);

    const handleSelect = async (optionId: string) => {
      if (isRevealed) return;

      // Check if this option already contains is_correct info (teacher/creator view)
      const teacherOption = q.options.find(
        (o) => o.is_correct !== undefined && o.is_correct !== null
      );

      if (teacherOption) {
        const correctOpt = q.options.find((o) => o.is_correct);
        const correctId = correctOpt?.id || "";
        const isCorr = optionId === correctId;
        const newResult = {
          isCorrect: isCorr,
          correctOptionId: correctId,
          solution: q.solution || null,
        };

        setSelectedId(optionId);
        setIsRevealed(true);
        setResult(newResult);

        try {
          const stored = sessionStorage.getItem(storageKey) || "{}";
          const data = JSON.parse(stored);
          data[q.id] = { selectedId: optionId, isRevealed: true, result: newResult };
          sessionStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
          console.error("Failed to save progress", e);
        }
      } else {
        try {
          const res = await apiPost<{
            is_correct: boolean;
            correct_option_id: string;
            solution: string | null;
          }>(`/api/v1/questions/${q.id}/answer`, { option_id: optionId });

          const newResult = {
            isCorrect: res.is_correct,
            correctOptionId: res.correct_option_id,
            solution: res.solution,
          };

          setSelectedId(optionId);
          setIsRevealed(true);
          setResult(newResult);

          const stored = sessionStorage.getItem(storageKey) || "{}";
          const data = JSON.parse(stored);
          data[q.id] = { selectedId: optionId, isRevealed: true, result: newResult };
          sessionStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
          console.error("Failed to validate answer", e);
        }
      }
    };

    const handleReset = () => {
      setSelectedId(null);
      setIsRevealed(false);
      setResult(null);
      setShowReferences(false);

      try {
        const stored = sessionStorage.getItem(storageKey) || "{}";
        const data = JSON.parse(stored);
        delete data[q.id];
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to reset progress", e);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="w-full min-w-0"
      >
        <Card
          className={cn(
            "border-none shadow-lg bg-white dark:bg-navy-blue/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all border-l-4 text-left",
            isRevealed
              ? (result?.isCorrect ?? q.options.find((o) => o.id === selectedId)?.is_correct)
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

                {q.difficulty && (
                  <span className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider text-center w-full min-w-[70px]",
                    q.difficulty === "EASY" && "bg-green-500/10 text-green-500 border border-green-500/20",
                    q.difficulty === "MEDIUM" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                    q.difficulty === "HARD" && "bg-red/10 text-red border border-red/20"
                  )}>
                    {q.difficulty === "EASY" ? "Dễ" : q.difficulty === "MEDIUM" ? "T.Bình" : "Khó"}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-8 min-w-0">
                <div className="text-xl font-medium text-dark-blue dark:text-white leading-relaxed select-text">
                  <Markdown content={q.content} />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((opt, i) => {
                    const isSelected = selectedId === opt.id;
                    const isCorrect = result
                      ? opt.id === result.correctOptionId
                      : opt.is_correct;

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
                        <span className="font-medium select-text min-w-0 flex-1">
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
                  {isRevealed && (result?.solution || q.solution) && (
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
                          <Markdown content={result?.solution || q.solution || ""} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isRevealed && relatedLessons.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-navy dark:text-light-blue uppercase tracking-widest">
                          <BookOpen className="size-4 text-primary" />
                          Bài học liên quan
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {relatedLessons.map((lesson) => {
                            const content = (
                              <div className="h-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary/40 transition-colors">
                                <p className="font-bold text-dark-blue dark:text-white line-clamp-2">
                                  {lesson.name}
                                </p>
                                {lesson.description && (
                                  <p className="mt-2 text-xs text-gray-navy dark:text-light-blue/70 line-clamp-2">
                                    {lesson.description}
                                  </p>
                                )}
                                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                                  Xem bài học <ArrowRight className="size-3" />
                                </span>
                              </div>
                            );
                            return lesson.slug ? (
                              <Link key={lesson.id} href={`/lessons/${lesson.slug}`}>
                                {content}
                              </Link>
                            ) : (
                              <div key={lesson.id}>{content}</div>
                            );
                          })}
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
                  {isRevealed && q.pool_type === "PRACTICE" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary font-bold flex items-center gap-2 hover:bg-primary/10 px-4 py-2 rounded-2xl"
                      onClick={() => setShowReferences(true)}
                    >
                      <BookOpen className="size-4" />
                      Tài liệu tham khảo
                    </Button>
                  )}
                  <div className="h-px flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!isRevealed}
                    className="text-primary font-bold flex items-center gap-2 hover:bg-primary/10 px-4 py-2 rounded-2xl disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => onExplain({ ...q, solution: result?.solution || q.solution })}
                  >
                    <Sparkles className="size-4" />
                    Xem gợi ý
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {showReferences && isRevealed && q.pool_type === "PRACTICE" && (
          <ReferenceDocumentsModal
            questionId={q.id}
            onClose={() => setShowReferences(false)}
          />
        )}
      </motion.div>
    );
  }
);

QuestionCard.displayName = "QuestionCard";
