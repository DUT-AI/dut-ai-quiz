"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { apiClient, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";

const PresignUploadSchema = z.object({
  presigned_url: z.string(),
  key: z.string(),
  public_url: z.string(),
});
type PresignUpload = z.infer<typeof PresignUploadSchema>;

interface TestFileUploadProps {
  hackathonId: string;
  kind: "public" | "private";
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function TestFileUpload({
  hackathonId,
  kind,
  value,
  onChange,
  onUploadingChange,
}: TestFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const label = kind === "public" ? "Public test CSV" : "Private answer CSV";

  const uploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Chỉ chấp nhận file CSV.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File CSV không được vượt quá 50 MB.");
      return;
    }

    const contentType = file.type || "text/csv";
    const objectName = kind === "public" ? "public_test.csv" : "private_answer.csv";
    const key = `hackathons/${hackathonId}/task-tests/${crypto.randomUUID()}/${objectName}`;

    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const presign = await apiPost<PresignUpload>(
        "/api/v1/uploads/presign",
        { key, content_type: contentType },
        PresignUploadSchema
      );
      await apiClient.put(presign.presigned_url, file, {
        headers: { "Content-Type": contentType },
        withCredentials: false,
        baseURL: "",
      });
      setFileName(file.name);
      onChange(presign.public_url);
      toast.success(`${label} đã được tải lên S3.`);
    } catch (error: any) {
      toast.error(error?.message || `Không thể tải ${label} lên S3.`);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-gray-navy dark:text-light-blue/70">
        {label} *
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !isUploading) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file && !isUploading) void uploadFile(file);
        }}
        className={cn(
          "flex min-h-28 cursor-pointer items-center justify-center border border-dashed p-4 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-slate-50/50 hover:border-primary/60 hover:bg-primary/[0.03] dark:border-white/15 dark:bg-white/[0.02]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="text-xs font-bold text-primary">Đang tải lên S3...</p>
          </div>
        ) : fileName && value ? (
          <div className="min-w-0 space-y-1">
            <CheckCircle2 className="mx-auto size-6 text-emerald-500" />
            <p className="truncate text-xs font-bold text-navy-blue dark:text-white">{fileName}</p>
            <p className="text-[11px] text-emerald-600">Đã tải lên, URL được điền tự động</p>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadCloud className="mx-auto size-6 text-gray-navy/50 dark:text-light-blue/50" />
            <p className="text-xs font-bold text-navy-blue dark:text-white">Kéo file CSV vào đây</p>
            <p className="text-[11px] text-gray-navy/55 dark:text-light-blue/50">hoặc nhấn để chọn file</p>
          </div>
        )}
      </div>
      <div className="relative">
        <FileSpreadsheet className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-navy/40" />
        <input
          type="url"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="URL sẽ tự động xuất hiện sau khi upload"
          className="w-full border border-gray-200 bg-transparent py-2.5 pl-10 pr-3 text-xs text-navy-blue focus:border-primary focus:outline-none dark:border-white/10 dark:text-white"
        />
      </div>
    </div>
  );
}
