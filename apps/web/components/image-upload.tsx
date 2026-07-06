"use client";
import { useRef, useState } from "react";
import { usePresignUpload } from "@/lib/queries";
import { apiClient } from "@/lib/api";

interface Props {
  onUploaded: (publicUrl: string) => void;
}

export default function ImageUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presign = usePresignUpload();

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `uploads/${crypto.randomUUID()}.${ext}`;
      const { presigned_url, public_url } = await presign.mutateAsync({
        key,
        content_type: file.type,
      });
      await apiClient.put(presigned_url, file, {
        headers: { "Content-Type": file.type },
        withCredentials: false,
        baseURL: "",
      });
      onUploaded(public_url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1 text-xs rounded bg-slate/20 hover:bg-slate/30 dark:bg-white/10 dark:hover:bg-white/20 transition disabled:opacity-50"
      >
        {uploading ? "Đang tải…" : "📎 Chèn ảnh"}
      </button>
      {error && <span className="text-red text-xs">{error}</span>}
    </div>
  );
}
