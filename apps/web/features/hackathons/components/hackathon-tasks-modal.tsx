"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileCode,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useHackathonTasks,
  useCreateHackathonTask,
  useUpdateHackathonTask,
  useDeleteHackathonTask,
} from "../queries";
import {
  getMetricLabel,
  METRIC_OPTIONS,
  type Hackathon,
  type HackathonTask,
  type MetricType,
} from "../types";
import { TestFileUpload } from "./test-file-upload";

interface HackathonTasksModalProps {
  hackathon: Hackathon;
  onClose: () => void;
}

export function HackathonTasksModal({
  hackathon,
  onClose,
}: HackathonTasksModalProps) {
  const { data: tasks = [], isLoading } = useHackathonTasks(hackathon.id);
  const createTaskMutation = useCreateHackathonTask(hackathon.id);
  const updateTaskMutation = useUpdateHackathonTask(hackathon.id);
  const deleteTaskMutation = useDeleteHackathonTask(hackathon.id);

  // Form State
  const [editingTask, setEditingTask] = useState<HackathonTask | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [descriptionMd, setDescriptionMd] = useState("");
  const [publicTestUrl, setPublicTestUrl] = useState("");
  const [privateTestUrl, setPrivateTestUrl] = useState("");
  const [metricType, setMetricType] = useState<MetricType>("accuracy");
  const [maxSubmissions, setMaxSubmissions] = useState(10);
  const [testUploads, setTestUploads] = useState({ public: false, private: false });

  const openCreateForm = () => {
    setIsCreating(true);
    setEditingTask(null);
    setName("");
    setDescriptionMd("");
    setPublicTestUrl("");
    setPrivateTestUrl("");
    setMetricType("accuracy");
    setMaxSubmissions(10);
  };

  const openEditForm = (task: HackathonTask) => {
    setEditingTask(task);
    setIsCreating(false);
    setName(task.name);
    setDescriptionMd(task.problem_description_md);
    setPublicTestUrl(task.public_test_url);
    setPrivateTestUrl(task.private_test_url);
    setMetricType(task.metric_type);
    setMaxSubmissions(task.max_submissions);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testUploads.public || testUploads.private) {
      toast.error("Vui lòng chờ tải file test lên S3 hoàn tất.");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên đề bài");
      return;
    }

    const body = {
      name: name.trim(),
      problem_description_md: descriptionMd.trim(),
      public_test_url: publicTestUrl.trim(),
      private_test_url: privateTestUrl.trim(),
      metric_type: metricType,
      max_submissions: Number(maxSubmissions),
    };

    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          body,
        });
        toast.success("Cập nhật đề bài thành công!");
        setEditingTask(null);
      } else {
        await createTaskMutation.mutateAsync(body);
        toast.success("Thêm mới đề bài thành công!");
        setIsCreating(false);
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (taskId: string, taskName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá đề bài "${taskName}"?`)) return;
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      toast.success("Xoá đề bài thành công!");
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-5xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10 p-8 flex flex-col max-h-[85vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy/60 dark:text-light-blue/60 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <FileCode className="size-6" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-navy-blue dark:text-white leading-tight">
                Quản lý Đề bài / Tasks
              </h3>
              <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-0.5">
                {hackathon.name} • {tasks.length} đề bài
              </p>
            </div>
          </div>

          {!isCreating && !editingTask && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Thêm Đề bài</span>
            </button>
          )}
        </div>

        {/* Khung chính */}
        <div className="flex-1 overflow-y-auto min-h-[500px] border border-gray-100 dark:border-white/5 rounded-3xl bg-white dark:bg-navy-blue flex">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-navy/70">
              Đang tải danh sách đề bài...
            </div>
          ) : (isCreating || editingTask) ? (
            /* Form thêm/sửa */
            <form onSubmit={handleSave} className="flex-1 p-6 md:p-8 space-y-5 text-left overflow-y-auto">
              <h4 className="text-base font-black text-navy-blue dark:text-white mb-2">
                {editingTask ? "Chỉnh sửa Đề bài" : "Thêm Đề bài Mới"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tên đề bài */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Tên đề bài *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Phân loại sắc thái bình luận, Dự báo giá nhà..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>

                {/* Metric */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Đánh giá (Metric)
                  </label>
                  <select
                    value={metricType}
                    onChange={(e) => setMetricType(e.target.value as MetricType)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:bg-navy-blue dark:text-white"
                  >
                    {(["Classification", "Regression"] as const).map((group) => (
                      <optgroup key={group} label={group}>
                        {METRIC_OPTIONS.filter((option) => option.group === group).map(
                          (option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ),
                        )}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Max Submissions */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Lượt nộp bài tối đa / đội
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxSubmissions}
                    onChange={(e) => setMaxSubmissions(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>

                <TestFileUpload
                  hackathonId={hackathon.id}
                  kind="public"
                  value={publicTestUrl}
                  onChange={setPublicTestUrl}
                  onUploadingChange={(uploading) =>
                    setTestUploads((current) => ({ ...current, public: uploading }))
                  }
                />

                <TestFileUpload
                  hackathonId={hackathon.id}
                  kind="private"
                  value={privateTestUrl}
                  onChange={setPrivateTestUrl}
                  onUploadingChange={(uploading) =>
                    setTestUploads((current) => ({ ...current, private: uploading }))
                  }
                />

                {/* Legacy URL inputs remain available in state for existing tasks. */}
                <div className="hidden">
                  <label className="text-[10px] font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    URL Test Công khai (Public Test URL)
                  </label>
                  <input
                    type="url"
                    value={publicTestUrl}
                    onChange={(e) => setPublicTestUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>

                <div className="hidden">
                  <label className="text-[10px] font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    URL Test Nội bộ (Private Test URL)
                  </label>
                  <input
                    type="url"
                    value={privateTestUrl}
                    onChange={(e) => setPrivateTestUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>

                {/* Mô tả chi tiết */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Mô tả yêu cầu đề bài (Markdown)
                  </label>
                  <textarea
                    value={descriptionMd}
                    onChange={(e) => setDescriptionMd(e.target.value)}
                    placeholder="Mô tả chi tiết bài toán, định dạng file nộp, cách chấm điểm..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTask(null);
                  }}
                  className="rounded-xl px-6 py-5 font-bold"
                >
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createTaskMutation.isPending ||
                    updateTaskMutation.isPending ||
                    testUploads.public ||
                    testUploads.private
                  }
                  className="rounded-xl px-8 py-5 bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95"
                >
                  <Save className="size-4" />
                  <span>
                    {createTaskMutation.isPending || updateTaskMutation.isPending
                      ? "Đang lưu..."
                      : "Lưu Đề bài"}
                  </span>
                </Button>
              </div>
            </form>
          ) : tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-gray-navy/60 dark:text-light-blue/50">
              <FileCode className="size-12 mb-3 opacity-30" />
              <p className="font-bold text-sm">Chưa có đề bài nào được tạo</p>
              <p className="text-xs mt-1">Bấm nút "Thêm đề bài" ở góc trên để bắt đầu soạn thảo đề thi.</p>
            </div>
          ) : (
            /* Bảng danh sách đề bài */
            <div className="flex-1 w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider">
                    <th className="p-4 px-6">Tên Đề bài</th>
                    <th className="p-4">Đánh giá (Metric)</th>
                    <th className="p-4">Lượt nộp</th>
                    <th className="p-4">Đường dẫn Test</th>
                    <th className="p-4 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors"
                    >
                      <td className="p-4 px-6 font-bold text-navy-blue dark:text-white max-w-[200px] truncate" title={task.name}>
                        {task.name}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-medium text-gray-navy dark:text-light-blue/80">
                          {getMetricLabel(task.metric_type)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-navy-blue dark:text-white">
                        {task.max_submissions} lượt
                      </td>
                      <td className="p-4 text-xs space-y-1">
                        {task.public_test_url && (
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-500 font-bold">Public:</span>
                            <a
                              href={task.public_test_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-0.5"
                            >
                              Link <ExternalLink className="size-2.5" />
                            </a>
                          </div>
                        )}
                        {task.private_test_url && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 font-bold">Private:</span>
                            <a
                              href={task.private_test_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-0.5"
                            >
                              Link <ExternalLink className="size-2.5" />
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(task)}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id, task.name)}
                            className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors cursor-pointer"
                            title="Xoá"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
