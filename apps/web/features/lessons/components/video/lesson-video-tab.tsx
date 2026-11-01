"use client";

import React, { useState, useEffect } from "react";
import { Tv, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Lesson, LessonVideo } from "../../types";
import { YouTubePlayer } from "./youtube-player";
import { VideoPlaylist } from "./video-playlist";

interface LessonVideoTabProps {
  lesson: Lesson;
  slug: string;
}

export function LessonVideoTab({ lesson, slug }: LessonVideoTabProps) {
  const videos = lesson.videos || [];
  const [activeVideo, setActiveVideo] = useState<LessonVideo | null>(
    videos.length > 0 ? videos[0] : null
  );

  // Sync if lesson.videos changes or loads
  useEffect(() => {
    if (videos.length > 0) {
      setActiveVideo((prev) => {
        if (!prev) return videos[0];
        const stillExists = videos.find((v) => v.id === prev.id);
        return stillExists || videos[0];
      });
    } else {
      setActiveVideo(null);
    }
  }, [videos]);

  if (videos.length === 0 || !activeVideo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 md:p-12 text-center rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
        <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-5 shadow-sm">
          <Tv className="size-8" />
        </div>
        <h3 className="text-xl font-black text-dark-blue dark:text-white mb-2">
          Chưa có video tham khảo
        </h3>
        <p className="text-sm font-medium text-gray-500 dark:text-white/60 max-w-md leading-relaxed mb-6">
          Bài học này hiện chưa được giáo viên đính kèm video YouTube tham khảo. Bạn có thể quay lại đọc lý thuyết hoặc làm bài tập thực hành.
        </p>
        <Link href={`/lessons/${slug}`}>
          <Button variant="outline" className="rounded-2xl font-bold flex items-center gap-2">
            <BookOpen className="size-4" />
            Đọc lý thuyết bài học
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Primary Video Player Area */}
      <div className="lg:col-span-8 w-full min-w-0">
        <YouTubePlayer video={activeVideo} />
      </div>

      {/* Video Playlist Sidebar: using CSS absolute positioning within relative grid cell */}
      <div className="lg:col-span-4 w-full h-full relative min-h-[350px]">
        <div className="lg:absolute lg:inset-0 w-full h-full">
          <VideoPlaylist
            videos={videos}
            activeVideoId={activeVideo.id}
            onSelectVideo={(v) => setActiveVideo(v)}
          />
        </div>
      </div>
    </div>
  );
}
