"use client";

import React from "react";
import Image from "next/image";
import { Play, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonVideo } from "../../types";

interface VideoPlaylistProps {
  videos: LessonVideo[];
  activeVideoId: string;
  onSelectVideo: (video: LessonVideo) => void;
}

export function VideoPlaylist({
  videos,
  activeVideoId,
  onSelectVideo,
}: VideoPlaylistProps) {
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col w-full h-full rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-navy-blue/60 p-4 md:p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-white/10 shrink-0">
        <div>
          <h3 className="text-base font-black text-dark-blue dark:text-white">
            Danh sách video
          </h3>
          <p className="text-xs text-gray-500 dark:text-white/50 font-medium">
            {videos.length} video tham khảo trong bài học
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 custom-scrollbar min-h-0">
        {videos.map((video, index) => {
          const isActive = video.id === activeVideoId;
          const thumbUrl = `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;

          return (
            <button
              key={video.id || index}
              type="button"
              onClick={() => onSelectVideo(video)}
              className={cn(
                "flex items-start gap-3.5 p-3 rounded-2xl text-left transition-all duration-200 border",
                isActive
                  ? "bg-primary/5 dark:bg-primary/10 border-primary/30 shadow-sm"
                  : "bg-gray-50/50 dark:bg-white/[0.02] border-transparent hover:bg-gray-100/70 dark:hover:bg-white/5 hover:border-gray-200/50 dark:hover:border-white/10"
              )}
            >
              {/* Thumbnail Container */}
              <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 bg-gray-900 border border-black/10">
                <Image
                  src={thumbUrl}
                  alt={video.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized
                />
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity",
                    isActive ? "bg-primary/30" : "bg-black/20 hover:bg-black/10"
                  )}
                >
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center text-white shadow-md",
                      isActive ? "bg-primary scale-110" : "bg-black/60"
                    )}
                  >
                    <Play className="size-3.5 fill-current ml-0.5" />
                  </div>
                </div>

                {video.start_seconds > 0 && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-tight">
                    {formatSeconds(video.start_seconds)}
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-gray-400 dark:text-white/40">
                    #{index + 1}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                      <CheckCircle2 className="size-3" /> Đang phát
                    </span>
                  )}
                </div>

                <h4
                  className={cn(
                    "text-xs md:text-sm font-bold line-clamp-2 leading-snug",
                    isActive
                      ? "text-primary dark:text-primary-light"
                      : "text-dark-blue dark:text-white"
                  )}
                >
                  {video.title}
                </h4>

                {video.start_seconds > 0 && (
                  <p className="text-[11px] font-medium text-gray-500 dark:text-white/50 flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> Từ {formatSeconds(video.start_seconds)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
