"use client";

import { motion } from "framer-motion";
import {
  Archive,
  BookOpenCheck,
  Edit3,
  Eye,
  Plus,
  Search,
  Filter,
  GraduationCap,
  Calendar,
  AlertCircle,
  Users
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HomeworkFormModal } from "@/features/homeworks/components/homework-form-modal";
import { SubmissionsPanel } from "@/features/homeworks/components/submissions-panel";
import {
  useArchiveHomework,
  useHomeworks,
} from "@/features/homeworks/queries";
import { Homework } from "@/features/homeworks/types";
import { useLessons } from "@/lib/queries";
import { formatDateTime, parseICT } from "@/lib/utils";
import { LessonFilter } from "@/features/homeworks/components/lesson-filter";

export default function TeacherHomeworksPage() {
  const { data, isLoading } = useHomeworks();
  const { data: lessons = [] } = useLessons();
  const archive = useArchiveHomework();

  const [editing, setEditing] = useState<Homework | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Homework | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Homework | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const archiveHomework = async (homework: Homework) => {
    setArchiveTarget(homework);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archive.mutateAsync(archiveTarget.id);
      toast.success("Đã lưu trữ bài tập");
      setArchiveTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu trữ");
    }
  };

  // Memoized stats calculations
  const stats = useMemo(() => {
    const homeworksList = data?.data || [];
    const totalHomeworks = homeworksList.length;

    return {
      totalHomeworks,
    };
  }, [data]);

  // Filtered homework list
  const filteredHomeworks = useMemo(() => {
    const list = data?.data || [];
    return list.filter((h) => {
      const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLesson = selectedLessonId === "" || h.lesson_id === selectedLessonId;
      return matchesSearch && matchesLesson;
    });
  }, [data, searchQuery, selectedLessonId]);

  return (
    <div className="space-y-8 pb-14 text-left">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-black text-dark-blue dark:text-white sm:text-4xl">
            <BookOpenCheck className="size-9 text-primary animate-pulse" /> Quản lý bài tập
          </h1>
          <p className="text-gray-navy dark:text-light-blue/80">
            Tạo, phân phối bài tập và theo dõi tiến trình nộp bài của học viên.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="shadow-md shadow-primary/20 h-11"
          >
            <Plus className="mr-2 size-4" /> Tạo bài tập mới
          </Button>
        </motion.div>
      </div>

      {/* Filter and Search Panel */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm bài tập theo tiêu đề hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-250 bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-900/60 dark:text-white"
            />
          </div>

          {/* Custom Lesson Filter Dropdown */}
          <LessonFilter
            lessons={lessons}
            selectedId={selectedLessonId}
            onChange={setSelectedLessonId}
          />
        </div>

        {/* Results count status */}
        <div className="text-sm text-gray-navy dark:text-light-blue/70">
          <strong className="text-primary"> Kết quả tìm kiếm: {filteredHomeworks.length}</strong> trên tổng số <strong className="text-primary">{stats.totalHomeworks}</strong> bài tập
        </div>
      </div>

      {/* Homework List Section */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="h-10 w-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-sm font-semibold text-gray-navy dark:text-light-blue animate-pulse">
            Đang tải dữ liệu bài tập...
          </p>
        </div>
      )}

      {!isLoading && filteredHomeworks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center dark:border-white/20">
          <AlertCircle className="mx-auto size-12 text-gray-300 dark:text-gray-navy mb-4" />
          <p className="font-bold text-dark-blue dark:text-white">Không tìm thấy bài tập</p>
          <p className="mt-1 text-sm text-gray-navy dark:text-light-blue/70">
            {searchQuery || selectedLessonId
              ? "Hãy thử thay đổi từ khóa hoặc bộ lọc bài học."
              : "Bắt đầu bằng cách tạo một bài tập mới."}
          </p>
        </div>
      )}

      {!isLoading && filteredHomeworks.length > 0 && (
        <div className="grid gap-5">
          {filteredHomeworks.map((homework, idx) => {
            const isOverdue = new Date() > parseICT(homework.deadline);
            const lessonName = lessons.find((l) => l.id === homework.lesson_id)?.name || "Bài học không xác định";

            return (
              <motion.div
                key={homework.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className="overflow-hidden border border-gray-150 bg-white shadow-sm dark:border-white/20 dark:bg-navy-blue/60 backdrop-blur-sm transition-all duration-355 hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50">
                  {/* Indicator Line color based on deadline */}
                  <div className={`h-1 w-full ${isOverdue ? "bg-red" : "bg-primary"}`} />

                  <CardHeader className="pb-3">
                    <div className="flex flex-col justify-between gap-3 md:flex-row">
                      <div className="space-y-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <GraduationCap className="size-3.5" />
                          {lessonName}
                        </span>
                        <CardTitle className="text-lg font-black text-dark-blue dark:text-white">
                          {homework.title}
                        </CardTitle>
                      </div>

                      <div className="flex flex-col items-start gap-1 md:items-end">
                        <Badge variant="outline" className="border-gray-200 dark:border-white/10 dark:text-light-blue">
                          <Calendar className="mr-1 size-3" />
                          Hạn: {formatDateTime(homework.deadline)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Submissions count statistics */}
                    <div className="flex items-center justify-between text-xs py-1 border border-gray-150 dark:border-white/10 rounded-xl px-3 bg-gray-50/50 dark:bg-zinc-950/20">
                      <span className="flex items-center gap-1.5 text-gray-navy dark:text-light-blue/85 font-semibold">
                        <Users className="size-3.5 text-primary" />
                        <span>Số lượng bài đã nộp:</span>
                      </span>
                      <span className="font-black text-primary text-sm">{homework.submitted_count} bài</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-gray-100 dark:border-white/5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewing(homework)}
                        className="h-9 rounded-xl border border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 dark:hover:border-indigo-500/40 transition-all font-bold text-xs"
                      >
                        <Eye className="mr-1.5 size-3.5" /> Xem bài nộp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(homework);
                          setFormOpen(true);
                        }}
                        className="h-9 rounded-xl border border-amber-100 bg-amber-50/30 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-300 dark:hover:border-amber-500/40 transition-all font-bold text-xs"
                      >
                        <Edit3 className="mr-1.5 size-3.5" /> Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveHomework(homework)}
                        className="h-9 rounded-xl border border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 dark:hover:border-rose-500/40 transition-all font-bold text-xs"
                      >
                        <Archive className="mr-1.5 size-3.5" /> Lưu trữ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modular Modals */}
      <HomeworkFormModal
        open={formOpen}
        homework={editing}
        onClose={() => setFormOpen(false)}
      />
      <SubmissionsPanel
        homework={viewing}
        onClose={() => setViewing(null)}
      />

      {/* Confirm Archive Modal */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        title="Lưu trữ bài tập này?"
        description={archiveTarget ? `Bạn có chắc chắn muốn lưu trữ bài tập "${archiveTarget.title}"? Học viên sẽ không thể xem hoặc nộp bài giải cho bài tập này nữa.` : ""}
        confirmText="Xác nhận lưu trữ"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
}
