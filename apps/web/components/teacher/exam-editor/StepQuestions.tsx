"use client";
import React, { useState, useMemo } from "react";
import { useLessons, useQuestions } from "@/lib/queries";
import { 
  Search, 
  Filter, 
  Layers, 
  HelpCircle, 
  Plus, 
  Minus, 
  GripVertical,
  BookOpen,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { renderMathInHTML } from "@/lib/render-math";

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function StepQuestions({ selectedIds, onChange }: Props) {
  const { data: lessons = [] } = useLessons();
  
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [activePoolType, setActivePoolType] = useState<string>("EXAM");
  const [search, setSearch] = useState("");

  const { data: allQuestions = [], isLoading: loadingQuestions } = useQuestions({
    lesson_id: activeLessonId || undefined,
    pool_type: activePoolType || undefined,
  });

  const availableQuestions = useMemo(() => {
    return allQuestions.filter(q => 
      !selectedIds.includes(q.id) && 
      q.content.toLowerCase().includes(search.toLowerCase())
    );
  }, [allQuestions, selectedIds, search]);

  const selectedQuestions = useMemo(() => {
    // We want to keep the order in selectedIds
    return selectedIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter(Boolean) as any[];
  }, [allQuestions, selectedIds]);

  const addQuestion = (id: string) => onChange([...selectedIds, id]);
  const removeQuestion = (id: string) => onChange(selectedIds.filter(i => i !== id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left: Question Bank */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-navy opacity-40" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-purple/50 transition-all font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-50 dark:bg-white/5">
              <button
                onClick={() => setActivePoolType("EXAM")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activePoolType === "EXAM" ? "bg-white dark:bg-navy-blue shadow-sm text-purple" : "text-gray-navy opacity-50"
                )}
              >
                Kiểm tra
              </button>
              <button
                onClick={() => setActivePoolType("PRACTICE")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activePoolType === "PRACTICE" ? "bg-white dark:bg-navy-blue shadow-sm text-purple" : "text-gray-navy opacity-50"
                )}
              >
                Luyện tập
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setActiveLessonId("")}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                activeLessonId === "" 
                  ? "bg-purple text-white border-purple" 
                  : "bg-white dark:bg-navy-blue border-gray-100 dark:border-white/5 text-gray-navy hover:border-purple/30"
              )}
            >
              Tất cả bài học
            </button>
            {lessons.map(lesson => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                  activeLessonId === lesson.id 
                    ? "bg-purple text-white border-purple" 
                    : "bg-white dark:bg-navy-blue border-gray-100 dark:border-white/5 text-gray-navy hover:border-purple/30"
                )}
              >
                {lesson.name}
              </button>
            ))}
          </div>

          <div className="h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {loadingQuestions ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-3xl bg-gray-50 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
                <Filter className="size-12 mb-4" />
                <p className="font-bold">Không có câu hỏi nào phù hợp bộ lọc</p>
              </div>
            ) : (
              availableQuestions.map((q, idx) => (
                <div 
                  key={q.id}
                  className="group flex gap-4 p-5 rounded-[2rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 hover:border-purple/30 transition-all hover:translate-x-1"
                >
                  <div className="size-10 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-navy font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium leading-relaxed line-clamp-2 break-words"
                      dangerouslySetInnerHTML={{ __html: renderMathInHTML(q.content.substring(0, 150)) }}
                    />
                    <div className="flex gap-2 mt-2">
                      {q.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-[9px] font-black uppercase text-indigo-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => addQuestion(q.id)}
                    className="size-10 rounded-2xl bg-purple/10 text-purple flex items-center justify-center hover:bg-purple hover:text-white transition-all shrink-0"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Questions & Ordering */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="p-6 rounded-[2.5rem] bg-purple text-white shadow-xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-80">Đề thi hiện tại</h3>
              <Sparkles className="size-4 opacity-60" />
            </div>
            <p className="text-4xl font-black mb-1">{selectedIds.length}</p>
            <p className="text-xs font-bold opacity-60">Câu hỏi đã được chọn</p>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-4 flex flex-col h-[400px]">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-[10px] font-black text-gray-navy opacity-40 uppercase tracking-widest italic">Sắp xếp đề</span>
              <button 
                onClick={() => onChange([])}
                className="text-[10px] font-bold text-red hover:underline"
              >
                Xóa hết
              </button>
            </div>

            <Reorder.Group 
              axis="y" 
              values={selectedIds} 
              onReorder={onChange}
              className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar"
            >
              {selectedQuestions.map((q) => (
                <Reorder.Item 
                  key={q.id} 
                  value={q.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-navy-blue shadow-sm border border-black/5 cursor-grab active:cursor-grabbing group"
                >
                  <GripVertical className="size-4 text-gray-navy opacity-20 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate">{q.content}</p>
                  </div>
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="size-6 rounded-lg hover:bg-red/10 text-red opacity-30 hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                  >
                    <Minus className="size-3" />
                  </button>
                </Reorder.Item>
              ))}
              {selectedIds.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 text-center">
                  <BookOpen className="size-10 mb-2" />
                  <p className="text-[10px] font-black uppercase">Chưa có câu hỏi nào</p>
                </div>
              )}
            </Reorder.Group>
          </div>
        </div>
      </div>
    </div>
  );
}
