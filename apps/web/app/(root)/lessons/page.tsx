"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { AnimatePresence } from "framer-motion";
import { LessonCard } from "@/features/lessons/components";
import { SearchBar } from "@/components/ui/search-bar";
import { Search } from "lucide-react";

export default function LessonsContentPage() {
  const router = useRouter();
  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredLessons = React.useMemo(() => {
    return lessons.filter((lesson) =>
      lesson.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lessons, searchQuery]);

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
        <div className="text-left space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white">
            Học tập & <span className="text-primary">Khám phá</span>
          </h1>
          <p className="text-gray-navy dark:text-light-blue">
            Hệ thống lộ trình bài học giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao.
          </p>
        </div>
        <div className="w-full md:w-auto shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Tìm kiếm bài học theo tên..."
          />
        </div>
      </div>

      <div className="w-full">
        {isLoadingLessons ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-bold">Đang tải giáo trình...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-gray-navy/40 dark:text-light-blue/30 mb-4">
              <Search className="size-12" />
            </div>
            <h3 className="text-lg font-bold text-dark-blue dark:text-white">
              Không tìm thấy bài học phù hợp
            </h3>
            <p className="text-sm text-gray-navy dark:text-light-blue/70 mt-1 max-w-xs">
              Thử tìm kiếm với từ khoá khác hoặc xoá tìm kiếm hiện tại.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Xoá tìm kiếm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredLessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  onClick={() => router.push(`/lessons/${lesson.slug || lesson.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}


