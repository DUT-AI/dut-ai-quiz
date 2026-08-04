"use client";

import { motion } from "framer-motion";
import { AlertCircle, FileArchive, UploadCloud, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  allowedSuffixes: string[];
  maxSizeMB?: number;
}

export function FileDropzone({
  file,
  onFileChange,
  allowedSuffixes,
  maxSizeMB = 10,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const validateAndSetFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const fileExtension = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    const isAllowed = allowedSuffixes.some((suffix) =>
      selectedFile.name.toLowerCase().endsWith(suffix)
    );

    if (!isAllowed) {
      toast.error(`Định dạng file không hợp lệ. Chỉ chấp nhận các file: ${allowedSuffixes.join(", ")}`);
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Kích thước file vượt quá ${maxSizeMB} MB`);
      return;
    }

    onFileChange(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileChange(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        type="file"
        id="homework-file-upload"
        className="hidden"
        accept={allowedSuffixes.join(",")}
        onChange={handleFileInput}
      />

      <label
        htmlFor="homework-file-upload"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="block w-full cursor-pointer"
      >
        <motion.div
          animate={{
            borderColor: isDragActive ? "hsl(var(--primary))" : "rgba(156, 163, 175, 0.3)",
            backgroundColor: isDragActive
              ? "rgba(38, 215, 130, 0.08)"
              : "rgba(244, 246, 250, 0.4)",
            scale: isDragActive ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-shadow dark:bg-white/5 dark:hover:bg-white/10 hover:border-primary/50 ${
            isDragActive
              ? "shadow-[0_0_15px_rgba(38,215,130,0.15)]"
              : "hover:shadow-sm"
          }`}
        >
          {!file ? (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-navy dark:text-light-blue">
                  <span className="text-primary hover:underline">Nhấp để tải lên</span> hoặc kéo thả file vào đây
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-navy">
                  Chấp nhận: {allowedSuffixes.join(", ")} (Tối đa {maxSizeMB} MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-4 rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileArchive className="h-5 w-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="truncate text-sm font-bold text-dark-blue dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-navy dark:text-light-blue">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red/10 text-red hover:bg-red hover:text-white transition-colors"
                title="Xóa tệp đã chọn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </label>
    </div>
  );
}
