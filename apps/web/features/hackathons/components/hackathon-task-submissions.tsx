"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import {
  useSubmissions,
  useSubmitTask,
  useCancelSubmission,
  useTaskSubmissionEvents,
} from "../queries";
import { UploadForm } from "./submissions/upload-form";
import { HistoryTable } from "./submissions/history-table";
import { LogsModal } from "./submissions/logs-modal";

interface HackathonTaskSubmissionsProps {
  taskId: string;
}

export function HackathonTaskSubmissions({ taskId }: HackathonTaskSubmissionsProps) {
  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false); // POST /submit phase
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [uploadPhase, setUploadPhase] = useState<"script" | "model" | "commit" | "idle">("idle");
  const [currentFileName, setCurrentFileName] = useState("");

  const lastUploadedBytes = useRef<number>(0);
  const lastProgressTime = useRef<number>(0);

  // Log modal state
  const [selectedSubIdForLogs, setSelectedSubIdForLogs] = useState<string | null>(null);

  // Queries & Mutations
  const submitMutation = useSubmitTask(taskId);
  const cancelMutation = useCancelSubmission(taskId);

  const { data: submissions = [], isLoading: isSubmissionsLoading } = useSubmissions(taskId);
  useTaskSubmissionEvents(taskId, !isUploading && !isCommitting);

  const handleUploadProgress = (phase: "script" | "model" | "commit", loaded: number, total: number) => {
    setUploadPhase(phase);
    if (phase === "commit") {
      setIsUploading(false);
      setIsCommitting(true);
      return;
    }

    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    setUploadPercent(percent);
    setUploadedBytes(loaded);
    setTotalBytes(total);

    const now = Date.now();
    const timeElapsed = (now - lastProgressTime.current) / 1000;

    if (timeElapsed >= 0.5 || percent === 100) {
      const bytesSent = loaded - lastUploadedBytes.current;
      const speed = bytesSent / timeElapsed;

      let speedStr = "";
      if (speed > 1024 * 1024) {
        speedStr = `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
      } else if (speed > 1024) {
        speedStr = `${(speed / 1024).toFixed(0)} KB/s`;
      } else {
        speedStr = `${speed.toFixed(0)} B/s`;
      }

      setUploadSpeed(speedStr);
      lastUploadedBytes.current = loaded;
      lastProgressTime.current = now;
    }
  };

  const handleSubmit = async (scriptFile: File, modelFile: File | null) => {
    setIsUploading(true);
    setIsCommitting(false);
    setUploadPhase("script");
    setCurrentFileName(scriptFile.name);
    setUploadPercent(0);
    setUploadedBytes(0);
    setTotalBytes(scriptFile.size);
    setUploadSpeed("Calculating...");

    lastProgressTime.current = Date.now();
    lastUploadedBytes.current = 0;

    try {
      await submitMutation.mutateAsync({
        scriptFile,
        modelFile,
        onProgress: (phase, loaded, total) => {
          if (phase === "model" && modelFile) {
            setCurrentFileName(modelFile.name);
          }
          handleUploadProgress(phase, loaded, total);
        },
      });
      toast.success("Nộp bài thành công! Tiến trình chấm điểm đang bắt đầu.");
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi nộp bài!");
      throw err;
    } finally {
      setIsUploading(false);
      setIsCommitting(false);
      setUploadPhase("idle");
      setCurrentFileName("");
    }
  };

  const handleCancel = async (subId: string) => {
    try {
      await cancelMutation.mutateAsync(subId);
      toast.success("Hủy lượt chấm bài thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể hủy lượt chấm bài này!");
    }
  };

  return (
    <div className="space-y-8 text-left mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
      {/* Upload Form */}
      <UploadForm
        isUploading={isUploading}
        isCommitting={isCommitting}
        uploadPhase={uploadPhase}
        currentFileName={currentFileName}
        uploadPercent={uploadPercent}
        uploadedBytes={uploadedBytes}
        totalBytes={totalBytes}
        uploadSpeed={uploadSpeed}
        onSubmit={handleSubmit}
      />

      {/* History Submissions Table */}
      <HistoryTable
        submissions={submissions}
        isLoading={isSubmissionsLoading}
        onCancel={handleCancel}
        onViewLogs={(id) => setSelectedSubIdForLogs(id)}
      />

      {/* Logs Modal Popup */}
      <LogsModal
        submissionId={selectedSubIdForLogs}
        onClose={() => setSelectedSubIdForLogs(null)}
      />
    </div>
  );
}
