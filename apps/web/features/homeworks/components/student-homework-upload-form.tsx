"use client";

import React from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "./file-dropzone";

interface StudentHomeworkUploadFormProps {
  homeworkId: string;
  hasPreviousSubmissions: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting: boolean;
}

export function StudentHomeworkUploadForm({
  homeworkId,
  hasPreviousSubmissions,
  file,
  onFileChange,
  onSubmit,
  isSubmitting,
}: StudentHomeworkUploadFormProps) {
  return (
    <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/10 dark:bg-navy-blue/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <CardTitle className="text-lg font-bold text-dark-blue dark:text-white">
            {hasPreviousSubmissions ? "Nộp lại bài làm mới" : "Nộp bài làm của bạn"}
          </CardTitle>
        </div>
        <p className="text-xs text-gray-navy dark:text-light-blue">
          {hasPreviousSubmissions
            ? "Bạn đã có bài nộp trước đó. Tải file mới lên nếu muốn nộp lại để cập nhật kết quả."
            : "Tải lên file mã nguồn nén theo đúng định dạng được yêu cầu (.zip, .rar, .7z, .tar.gz, .gz)."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <FileDropzone
              inputId={`homework-file-upload-${homeworkId}`}
              file={file}
              onFileChange={onFileChange}
              allowedSuffixes={[".zip", ".rar", ".7z", ".tar.gz", ".gz"]}
              maxSizeMB={20}
            />
          </div>

          <div className="w-full sm:w-auto">
            <Button
              disabled={!file || isSubmitting}
              onClick={onSubmit}
              className="w-full sm:w-44 h-12 font-bold shadow-sm shadow-primary/20 rounded-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Đang nộp...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="size-4" />
                  {hasPreviousSubmissions ? "Nộp lại bài" : "Nộp bài"}
                </span>
              )}
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-gray-navy dark:text-light-blue/70">
          * Chấp nhận .zip, .rar, .7z, .tar.gz, .gz; dung lượng tối đa 20 MB.
        </p>
      </CardContent>
    </Card>
  );
}
