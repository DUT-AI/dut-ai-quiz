"use client";

import { Archive, BookOpenCheck, Edit3, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeworkFormModal } from "@/features/homeworks/components/homework-form-modal";
import { SubmissionsPanel } from "@/features/homeworks/components/submissions-panel";
import {
  useArchiveHomework,
  useHomeworks,
} from "@/features/homeworks/queries";
import { Homework } from "@/features/homeworks/types";
import { useLessons } from "@/lib/queries";

export default function TeacherHomeworksPage() {
  const { data, isLoading } = useHomeworks();
  const { data: lessons = [] } = useLessons();
  const archive = useArchiveHomework();
  const [editing, setEditing] = useState<Homework | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Homework | null>(null);

  const archiveHomework = async (homework: Homework) => {
    if (!window.confirm(`Lưu trữ bài tập "${homework.title}"?`)) return;
    try {
      await archive.mutateAsync(homework.id);
      toast.success("Đã lưu trữ bài tập");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu trữ");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-black">
            <BookOpenCheck className="size-9 text-primary" /> Quản lý bài tập
          </h1>
          <p className="mt-2 text-gray-navy">
            Tạo, giao bài và theo dõi toàn bộ lịch sử nộp bài.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Tạo bài tập
        </Button>
      </div>

      {isLoading && <p className="py-12 text-center opacity-50">Đang tải...</p>}
      <div className="grid gap-5">
        {data?.data.map((homework) => (
          <Card key={homework.id} className="border-none shadow-lg">
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <CardTitle className="text-xl">{homework.title}</CardTitle>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary">
                    {lessons.find((lesson) => lesson.id === homework.lesson_id)
                      ?.name ?? "Bài học không xác định"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-navy">
                    {homework.description}
                  </p>
                </div>
                <Badge variant="outline">
                  {new Date(homework.deadline).toLocaleString("vi-VN")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex gap-5 text-sm">
                <span><strong>{homework.assignment_count}</strong> người được giao</span>
                <span><strong>{homework.submitted_count}</strong> người đã nộp</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setViewing(homework)}>
                  <Eye className="mr-2 size-4" /> Bài nộp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(homework);
                    setFormOpen(true);
                  }}
                >
                  <Edit3 className="mr-2 size-4" /> Sửa
                </Button>
                <Button variant="destructive" onClick={() => archiveHomework(homework)}>
                  <Archive className="mr-2 size-4" /> Lưu trữ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <HomeworkFormModal
        open={formOpen}
        homework={editing}
        onClose={() => setFormOpen(false)}
      />
      <SubmissionsPanel homework={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
