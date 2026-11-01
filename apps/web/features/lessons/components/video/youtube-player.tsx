"use client";

import React, { useState } from "react";
import { ExternalLink, Play, Clock } from "lucide-react";
import type { LessonVideo } from "../../types";

interface YouTubePlayerProps {
  video: LessonVideo;
}

export function YouTubePlayer({ video }: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Use youtube-nocookie.com for privacy and enhanced performance
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtube_video_id}?${
    video.start_seconds > 0 ? `start=${video.start_seconds}&` : ""
  }rel=0&modestbranding=1`;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col w-full rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 bg-white dark:bg-navy-blue/60 shadow-sm">
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full aspect-video bg-black/90">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/40 backdrop-blur-sm z-10 text-white">
            <div className="size-10 border-3 border-primary border-t-transparent animate-spin rounded-full" />
            <span className="text-xs font-semibold tracking-wide text-white/80">
              Đang tải video...
            </span>
          </div>
        )}
        <iframe
          src={embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* Video Details Header */}
      <div className="p-6 md:p-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-[280px]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                <Play className="size-3 fill-current" />
                Video tham khảo
              </span>
              {video.start_seconds > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="size-3" />
                  Bắt đầu từ {formatSeconds(video.start_seconds)}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-dark-blue dark:text-white leading-snug">
              {video.title}
            </h2>
          </div>

          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-primary dark:text-white/60 dark:hover:text-white bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 transition-colors shrink-0"
          >
            <span>Mở trên YouTube</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {video.description && (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70 leading-relaxed whitespace-pre-line border-t border-gray-100 dark:border-white/5 pt-3">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
