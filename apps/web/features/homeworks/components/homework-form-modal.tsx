"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import StepParticipants from "@/features/exams/components/exam-editor/StepParticipants";
import { useLessons } from "@/lib/queries";
import { useCreateHomework, useUpdateHomework } from "../queries";
import { Homework } from "../types";

export function HomeworkFormModal({
  open,
  homework,
  onClose,
}: {
  open: boolean;
  homework: Homework | null;
  onClose: () => void;
}) {
  const create = useCreateHomework();
  const update = useUpdateHomework();
  const { data: lessons = [] } = useLessons();
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setLessonId(homework?.lesson_id ?? "");
    setTitle(homework?.title ?? "");
    setDescription(homework?.description ?? "");
    setDeadline(homework?.deadline.slice(0, 16) ?? "");
    setAssigneeIds(homework?.assignee_ids ?? []);
    setFile(null);
  }, [homework, open]);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lessonId || !title.trim() || !deadline || assigneeIds.length === 0) {
      return toast.error(
        "Vui lòng chọn bài học, nhập tiêu đề, deadline và người nhận",
      );
    }
    const values = {
      lessonId,
      title,
      description,
      deadline,
      assigneeIds,
      file,
    };
    try {
      if (homework) {
        await update.mutateAsync({ id: homework.id, values });
        toast.success("Cập nhật bài tập thành công");
      } else {
        await create.mutateAsync(values);
        toast.success("Tạo bài tập thành công");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thao tác thất bại");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-navy-blue md:p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              {homework ? "Chỉnh sửa bài tập" : "Tạo bài tập"}
            </h2>
            <p className="text-sm text-gray-navy">
              Giao bài cho từng thành viên hoặc chọn cả team.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold">Bài học</span>
            <select
              value={lessonId}
              onChange={(event) => setLessonId(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none ring-primary focus:ring-2 dark:bg-white/5"
              required
            >
              <option value="">Chọn bài học chứa bài tập coding</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold">Tiêu đề</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none ring-primary focus:ring-2 dark:bg-white/5"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold">Hạn nộp</span>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none ring-primary focus:ring-2 dark:bg-white/5"
              required
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold">Mô tả / đề bài</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none ring-primary focus:ring-2 dark:bg-white/5"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold">File đề đính kèm</span>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/5"
            />
          </label>
        </div>

        <div className="mb-8">
          <StepParticipants selectedIds={assigneeIds} onChange={setAssigneeIds} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {homework ? "Lưu thay đổi" : "Tạo và giao bài"}
          </Button>
        </div>
      </form>
    </div>
  );
}
