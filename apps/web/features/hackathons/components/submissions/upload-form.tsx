"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileCode, X, Loader2, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadFormProps {
  isUploading: boolean;
  isCommitting: boolean;
  uploadPhase: "script" | "model" | "commit" | "idle";
  currentFileName: string;
  uploadPercent: number;
  uploadedBytes: number;
  totalBytes: number;
  uploadSpeed: string;
  onSubmit: (script: File, model: File | null) => Promise<void>;
}

export function UploadForm({
  isUploading,
  isCommitting,
  uploadPhase,
  currentFileName,
  uploadPercent,
  uploadedBytes,
  totalBytes,
  uploadSpeed,
  onSubmit,
}: UploadFormProps) {
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);

  const [isDragOverScript, setIsDragOverScript] = useState(false);
  const [isDragOverModel, setIsDragOverModel] = useState(false);

  const scriptInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const handleScriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File script vượt quá giới hạn 10 MB!");
        return;
      }
      setScriptFile(file);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("File model weight vượt quá giới hạn 1 GB!");
        return;
      }
      setModelFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleScriptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverScript(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith(".py")) {
        toast.error("Vui lòng chỉ nộp file Python (.py)!");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File script vượt quá giới hạn 10 MB!");
        return;
      }
      setScriptFile(file);
    }
  };

  const handleModelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverModel(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("File model weight vượt quá giới hạn 1 GB!");
        return;
      }
      setModelFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptFile) {
      toast.error("Vui lòng chọn hoặc kéo thả file script dự đoán!");
      return;
    }

    try {
      await onSubmit(scriptFile, modelFile);
      setScriptFile(null);
      setModelFile(null);
    } catch {
      // Error handling managed by parent container
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="bg-slate-50/50 dark:bg-white/[0.005] p-6 md:p-8 rounded-[2rem] border border-gray-150 dark:border-white/5 space-y-6">
      <h5 className="text-sm font-black text-navy-blue dark:text-white flex items-center gap-2">
        <Upload className="size-4 text-primary" />
        Nộp bài thi mới
      </h5>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Predict Script Zone */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-gray-navy/70 dark:text-light-blue/70 flex items-center gap-1 h-5">
              Predict Script (File .py bắt buộc - Tối đa 10 MB) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              ref={scriptInputRef}
              accept=".py"
              onChange={handleScriptChange}
              disabled={isUploading}
              className="hidden"
            />
            <motion.div
              onDragOver={handleDragOver}
              onDragEnter={() => setIsDragOverScript(true)}
              onDragLeave={() => setIsDragOverScript(false)}
              onDrop={handleScriptDrop}
              onClick={() => !isUploading && scriptInputRef.current?.click()}
              whileHover={{ scale: isUploading ? 1 : 1.005 }}
              whileTap={{ scale: isUploading ? 1 : 0.995 }}
              className={cn(
                "rounded-[1.5rem] border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[140px]",
                scriptFile
                  ? "border-primary/40 bg-primary/5 dark:bg-primary/[0.02]"
                  : "border-gray-200 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-white/[0.01]",
                isDragOverScript && "border-primary bg-primary/10 dark:bg-primary/[0.05]",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {scriptFile ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <FileCode className="size-6" />
                  </div>
                  <div className="text-xs font-bold text-navy-blue dark:text-white max-w-[220px] truncate">
                    {scriptFile.name}
                  </div>
                  <div className="text-[10px] text-gray-navy/60 dark:text-light-blue/60">
                    Dung lượng: {formatSize(scriptFile.size)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScriptFile(null);
                    }}
                    disabled={isUploading}
                    className="mt-1 px-3 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="size-3" /> Hủy chọn
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-gray-navy/60 dark:text-light-blue/60 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-white/5 text-gray-navy/70 dark:text-light-blue/70">
                    <Upload className="size-5" />
                  </div>
                  <div className="text-xs font-bold text-navy-blue dark:text-white">
                    Kéo thả file script vào đây
                  </div>
                  <div className="text-[10px]">hoặc click để tìm kiếm tệp (.py)</div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Model Weights Zone */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-gray-navy/70 dark:text-light-blue/70 flex items-center gap-1 h-5">
              Model Weight (File bắt buộc - Tối đa 1 GB) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              ref={modelInputRef}
              onChange={handleModelChange}
              disabled={isUploading}
              className="hidden"
            />
            <motion.div
              onDragOver={handleDragOver}
              onDragEnter={() => setIsDragOverModel(true)}
              onDragLeave={() => setIsDragOverModel(false)}
              onDrop={handleModelDrop}
              onClick={() => !isUploading && modelInputRef.current?.click()}
              whileHover={{ scale: isUploading ? 1 : 1.005 }}
              whileTap={{ scale: isUploading ? 1 : 0.995 }}
              className={cn(
                "rounded-[1.5rem] border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[140px]",
                modelFile
                  ? "border-primary/40 bg-primary/5 dark:bg-primary/[0.02]"
                  : "border-gray-200 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-white/[0.01]",
                isDragOverModel && "border-primary bg-primary/10 dark:bg-primary/[0.05]",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {modelFile ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <FileCode className="size-6" />
                  </div>
                  <div className="text-xs font-bold text-navy-blue dark:text-white max-w-[220px] truncate">
                    {modelFile.name}
                  </div>
                  <div className="text-[10px] text-gray-navy/60 dark:text-light-blue/60">
                    Dung lượng: {formatSize(modelFile.size)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModelFile(null);
                    }}
                    disabled={isUploading}
                    className="mt-1 px-3 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="size-3" /> Hủy chọn
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-gray-navy/60 dark:text-light-blue/60 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-white/5 text-gray-navy/70 dark:text-light-blue/70">
                    <Upload className="size-5" />
                  </div>
                  <div className="text-xs font-bold text-navy-blue dark:text-white">
                    Kéo thả file model weights vào đây
                  </div>
                  <div className="text-[10px]">hoặc click để tìm kiếm tệp (weights/bin/pth...)</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Phase 1: S3 Upload Progress Bar */}
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/10"
          >
            <div className="flex justify-between items-center text-xs font-bold text-navy-blue dark:text-white">
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                {uploadPercent === 100 ? (
                  <span className="text-amber-500">Đang lưu tệp lên server S3...</span>
                ) : (
                  <span>
                    Đang tải {uploadPhase === "script" ? "script" : "model weight"}: <span className="text-primary truncate max-w-[180px] font-mono">{currentFileName}</span>
                  </span>
                )}
              </span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-navy/70 dark:text-light-blue/70">
              <span>{formatSize(uploadedBytes)} / {formatSize(totalBytes)}</span>
              <span>Tốc độ: {uploadPercent === 100 ? "0 B/s" : uploadSpeed}</span>
            </div>
          </motion.div>
        )}

        {/* Phase 2: Backend Commit Spinner (POST /submit) */}
        {isCommitting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl"
          >
            <Loader2 className="size-4 animate-spin text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy-blue dark:text-white">
                Đang xử lý bài nộp...
              </p>
              <p className="text-[10px] text-gray-navy/60 dark:text-light-blue/60 mt-0.5">
                Tệp đã được tải lên. Hệ thống đang ghi nhận và xếp lịch chấm điểm.
              </p>
            </div>
          </motion.div>
        )}

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isUploading || isCommitting || !scriptFile || !modelFile}
            className="rounded-xl px-6 py-2.5 font-bold cursor-pointer transition-transform"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang tải lên S3...
              </>
            ) : isCommitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Play className="size-4 mr-2" />
                Nộp bài và Chấm điểm
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
