"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Video,
  Play,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { parseYouTubeUrl } from "../../lib/youtube";
import type { LessonVideoInput } from "../../types";

interface LessonVideoFormSectionProps {
  videos: LessonVideoInput[];
  onChange: (videos: LessonVideoInput[]) => void;
}

export function LessonVideoFormSection({
  videos,
  onChange,
}: LessonVideoFormSectionProps) {
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const parsedPreview = parseYouTubeUrl(urlInput);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    if (!val.trim()) {
      setUrlError(null);
      return;
    }
    const parsed = parseYouTubeUrl(val);
    if (!parsed) {
      setUrlError("Đường link không phải là link video YouTube hợp lệ");
    } else {
      setUrlError(null);
    }
  };

  const handleAddVideo = () => {
    if (!urlInput.trim()) {
      setUrlError("Vui lòng nhập đường link YouTube");
      return;
    }
    const parsed = parseYouTubeUrl(urlInput);
    if (!parsed) {
      setUrlError("Đường dẫn video phải là link YouTube hợp lệ");
      return;
    }
    if (!titleInput.trim()) {
      setUrlError("Vui lòng nhập tiêu đề cho video này");
      return;
    }

    const newVideo: LessonVideoInput = {
      title: titleInput.trim(),
      url: urlInput.trim(),
      description: descInput.trim(),
      order: videos.length,
    };

    onChange([...videos, newVideo]);
    setUrlInput("");
    setTitleInput("");
    setDescInput("");
    setUrlError(null);
  };

  const handleRemove = (index: number) => {
    const updated = videos.filter((_, i) => i !== index).map((v, i) => ({
      ...v,
      order: i,
    }));
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...videos];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    onChange(copy.map((v, i) => ({ ...v, order: i })));
  };

  const handleMoveDown = (index: number) => {
    if (index === videos.length - 1) return;
    const copy = [...videos];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    onChange(copy.map((v, i) => ({ ...v, order: i })));
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Video className="size-4 text-primary" />
          Quản lý Video bài giảng tham khảo
        </h3>
        <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 mt-1">
          Gắn các video YouTube giải bài tập, lý thuyết hoặc bài giảng trực quan vào bài học này.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-60 uppercase tracking-widest">
            Đường link YouTube
          </label>
          <input
            type="text"
            placeholder="Ví dụ: https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s"
            value={urlInput}
            onChange={handleUrlChange}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none transition-all font-medium text-sm text-dark-blue dark:text-white"
          />
          {urlError && (
            <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 pt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              {urlError}
            </p>
          )}
        </div>

        {/* Live Preview Box when URL is valid */}
        {parsedPreview && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
            <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
              <Image
                src={parsedPreview.thumbnailUrl}
                alt="Preview"
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="size-4 text-white fill-current" />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-xs space-y-1">
              <p className="font-bold text-dark-blue dark:text-white truncate">
                Mã video: <span className="font-mono text-primary">{parsedPreview.videoId}</span>
              </p>
              {parsedPreview.startSeconds > 0 ? (
                <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="size-3" />
                  Bắt đầu từ: {formatSeconds(parsedPreview.startSeconds)} ({parsedPreview.startSeconds}s)
                </p>
              ) : (
                <p className="text-gray-500 dark:text-white/50">Phát từ đầu (0:00)</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-60 uppercase tracking-widest">
              Tiêu đề hiển thị
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Hướng dẫn tìm cực trị và tiệm cận"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none transition-all font-medium text-sm text-dark-blue dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-60 uppercase tracking-widest">
              Ghi chú thêm (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Lưu ý xem kỹ ví dụ số 3"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none transition-all font-medium text-sm text-dark-blue dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleAddVideo}
            disabled={!parsedPreview || !titleInput.trim()}
            className="rounded-xl font-bold px-5 py-2.5 flex items-center gap-2"
          >
            <Plus className="size-4" />
            Thêm vào danh sách video
          </Button>
        </div>
      </div>

      {/* List of Attached Videos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-70 uppercase tracking-wider">
            Video đã thêm ({videos.length})
          </h4>
        </div>

        {videos.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-400 font-medium">
            Chưa có video tham khảo nào được thêm. Hãy dán link YouTube ở trên để thêm video.
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {videos.map((video, index) => {
                const parsed = parseYouTubeUrl(video.url);
                const thumb = parsed?.thumbnailUrl || "";

                return (
                  <motion.div
                    key={video.id || `${video.url}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/10 shadow-sm"
                  >
                    <span className="text-xs font-black text-gray-400 w-5 text-center">
                      #{index + 1}
                    </span>

                    {thumb && (
                      <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
                        <Image
                          src={thumb}
                          alt={video.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h5 className="text-sm font-bold text-dark-blue dark:text-white truncate">
                        {video.title}
                      </h5>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-white/50">
                        {parsed && parsed.startSeconds > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatSeconds(parsed.startSeconds)}
                          </span>
                        )}
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1 text-gray-400 hover:text-primary truncate max-w-[240px]"
                        >
                          <span className="truncate">{video.url}</span>
                          <ExternalLink className="size-2.5 shrink-0" />
                        </a>
                      </div>
                      {video.description && (
                        <p className="text-xs text-gray-600 dark:text-white/60 truncate">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Order & Delete Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        className="size-8 p-0 rounded-lg text-gray-400 hover:text-dark-blue dark:hover:text-white"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === videos.length - 1}
                        onClick={() => handleMoveDown(index)}
                        className="size-8 p-0 rounded-lg text-gray-400 hover:text-dark-blue dark:hover:text-white"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        className="size-8 p-0 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Xóa video"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
