"use client";

import React, { useState, useRef } from "react";
import { Send, Image as ImageIcon, Paperclip, FileText, X, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { usePresignUpload } from "@/lib/queries";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface CommentFormProps {
  onSubmit: (content: string, imageUrls: string[]) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  isReply?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = "Chia sẻ ý kiến hoặc đặt câu hỏi của bạn...",
  submitLabel = "Bình luận",
  isReply = false,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presign = usePresignUpload();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 3) {
      toast.error("Bạn chỉ có thể đính kèm tối đa 3 tệp hoặc hình ảnh.");
      return;
    }

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} vượt quá giới hạn 20MB.`);
          continue;
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `comments/${crypto.randomUUID()}_${safeName}`;
        const contentType = file.type || "application/octet-stream";

        const { presigned_url, public_url } = await presign.mutateAsync({
          key,
          content_type: contentType,
        });

        await apiClient.put(presigned_url, file, {
          headers: { "Content-Type": contentType },
          withCredentials: false,
          baseURL: "",
        });

        newUrls.push(public_url);
      }
      setImageUrls((prev) => [...prev, ...newUrls]);
      if (newUrls.length > 0) {
        toast.success("Tải tệp đính kèm lên thành công!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể tải tệp lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) return;
    if (content.length > 5000) {
      toast.error("Nội dung bình luận không được vượt quá 5000 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(content, imageUrls);
      setContent("");
      setImageUrls([]);
    } catch (error: any) {
      console.error("Submit comment error:", error);
      toast.error(error.message || "Không thể gửi bình luận.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
        <p className="text-sm text-gray-navy dark:text-light-blue opacity-80 mb-3">
          Vui lòng đăng nhập để tham gia thảo luận và gửi phản hồi.
        </p>
      </div>
    );
  }

  const isDisableSubmit =
    (!content.trim() && imageUrls.length === 0) ||
    content.length > 5000 ||
    submitting ||
    uploading;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-3 w-full animate-in fade-in duration-300 ${
        isReply ? "pl-6 sm:pl-10 mt-2" : ""
      }`}
    >
      <div className="hidden sm:block shrink-0">
        <Avatar className="size-9 border border-gray-100 dark:border-white/10">
          {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
            {user?.name?.slice(0, 2).toUpperCase() || "ME"}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 space-y-3">
        <div className="relative rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#1A263B]/60 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 overflow-hidden">
          <textarea
            autoFocus={autoFocus}
            value={content}
            onChange={handleTextChange}
            placeholder={placeholder}
            rows={isReply ? 2 : 3}
            className="w-full px-4 py-3 bg-transparent text-sm text-dark-blue dark:text-white placeholder:text-gray-navy/50 dark:placeholder:text-light-blue/40 focus:outline-none resize-none no-scrollbar font-sans leading-relaxed"
          />

          {/* Character counter overlay */}
          <div className="absolute right-3 bottom-2 text-[10px] text-gray-navy/40 dark:text-light-blue/30 font-semibold">
            <span className={content.length > 5000 ? "text-red" : ""}>
              {content.length}
            </span>
            /5000
          </div>
        </div>

        {/* Selected Images & Files Preview */}
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
            {imageUrls.map((url, idx) => {
              const cleanUrl = url.split("?")[0].toLowerCase();
              const isImage =
                cleanUrl.endsWith(".jpg") ||
                cleanUrl.endsWith(".jpeg") ||
                cleanUrl.endsWith(".png") ||
                cleanUrl.endsWith(".gif") ||
                cleanUrl.endsWith(".webp") ||
                cleanUrl.endsWith(".svg");

              if (isImage) {
                return (
                  <div
                    key={idx}
                    className="group relative size-16 rounded-xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`attachment-${idx}`}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              }

              let fileName = "Tệp đính kèm";
              try {
                const parts = new URL(url).pathname.split("/");
                fileName = decodeURIComponent(parts.pop() || "Tệp đính kèm");
              } catch {
                /* fallback */
              }

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-white/5 text-xs text-dark-blue dark:text-light-blue shadow-xs"
                >
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="max-w-[140px] truncate font-medium">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-navy hover:text-red transition-colors ml-1"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Toolbar & Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.zip,.rar,.7z,.txt,.docx,.py,.json"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={imageUrls.length >= 3 || uploading || submitting}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUrls.length >= 3 || uploading || submitting}
              className="h-8 rounded-xl px-3 border-gray-200 dark:border-white/10 text-gray-navy hover:text-primary dark:text-light-blue dark:hover:text-white"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Paperclip className="size-4" />
              )}
              <span className="hidden sm:inline text-xs ml-1.5 font-bold">Đính kèm tệp / ảnh</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={submitting}
                className="h-8 rounded-xl px-3 text-xs text-gray-navy dark:text-light-blue font-bold"
              >
                Hủy
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={isDisableSubmit}
              className="h-8 rounded-xl px-4 text-xs font-black shadow-md shadow-primary/20 text-white"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Send className="size-3.5 mr-1.5" />
              )}
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
