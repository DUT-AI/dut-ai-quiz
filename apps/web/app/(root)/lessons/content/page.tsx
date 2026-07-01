"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLessons, useCreateLesson } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ChevronRight,
  Plus,
  Sparkles,
  X,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LessonsTabLayout } from "@/components/lessons/lessons-tab-layout";

export default function LessonsContentPage() {
  const router = useRouter();
  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <LessonsTabLayout activeTab="content">
      <div className="w-full">
        {/* New Lesson creation button inside the tab panel */}
        <div className="flex justify-end mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group"
          >
            <Plus className="size-5 group-hover:rotate-90 transition-transform" />
            Tạo bài học mới
          </motion.button>
        </div>

        {isLoadingLessons ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-bold">Đang tải giáo trình...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => router.push(`/lessons/content/${lesson.id}`)}
                  className="cursor-pointer"
                >
                  <Card className="h-full border-none shadow-xl bg-white dark:bg-navy-blue/40 rounded-3xl overflow-hidden group">
                    <div className="h-2 w-full bg-primary/10 group-hover:bg-primary transition-colors" />
                    <CardContent className="p-8 text-left">
                      <div className="flex justify-between items-start mb-6">
                        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                          {lesson.order}
                        </div>
                        <Badge className="bg-green/10 text-green border-none">Sẵn sàng</Badge>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-dark-blue dark:text-white mb-3 group-hover:text-primary transition-colors">
                        {lesson.name}
                      </h3>
                      <p className="text-gray-navy dark:text-light-blue text-sm line-clamp-2 mb-6 opacity-70">
                        {lesson.description || "Tìm hiểu sâu về các khái niệm và bài tập thực hành của chương học này."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-navy font-bold uppercase tracking-widest opacity-60">
                           <FileText className="size-4" />
                           Kiến thức trọng tâm
                        </div>
                        <ChevronRight className="size-5 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {showCreateModal && (
            <CreateLessonModal onClose={() => setShowCreateModal(false)} />
          )}
        </AnimatePresence>
      </div>
    </LessonsTabLayout>
  );
}

function CreateLessonModal({ onClose }: { onClose: () => void }) {
  const createMut = useCreateLesson();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await createMut.mutateAsync({
      name,
      description,
      order: parseInt(order) || 1
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10"
      >
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white">
                <Plus className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-dark-blue dark:text-white">Thêm <span className="text-primary">Bài học mới</span></h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">Tên bài học</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Giải tích 1 - Đạo hàm"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">Mô tả ngắn</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả nội dung trọng tâm của bài học..."
                rows={3}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">Thứ tự</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-2 p-4 text-xs font-bold text-gray-navy opacity-40">
                  <BookOpen className="size-4" />
                  Học phần chính
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
               <Button 
                type="button"
                variant="ghost" 
                onClick={onClose}
                className="flex-1 py-6 rounded-2xl font-bold"
               >
                 Hủy
               </Button>
               <Button 
                type="submit"
                disabled={!name.trim() || createMut.isPending}
                className="flex-2 px-10 py-6 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
               >
                 {createMut.isPending ? (
                   <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                 ) : (
                   <Sparkles className="size-4" />
                 )}
                 Tạo ngay
               </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}
