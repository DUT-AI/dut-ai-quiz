"use client";
import { useState } from "react";
import { useLessons } from "@/lib/queries";
import { usePracticeStore } from "@/store/practice-store";
import { renderMathInHTML } from "@/lib/render-math";
import type { Lesson, PracticeMode } from "@/lib/types";
import ImageBackground from "@/components/atoms/image-background";
import MaxWidthWrapper from "@/components/atoms/max-width-wrapper";

/* ──────────── Lesson card ──────────────────────────────── */
function LessonCard({
  lesson,
  onSelect,
}: {
  lesson: Lesson;
  onSelect: (lesson: Lesson, mode: PracticeMode) => void;
}) {
  return (
    <div className="bg-white dark:bg-dark-blue rounded-2xl p-5 shadow-sm border border-slate/10 dark:border-white/10 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div>
        {lesson.order > 0 && (
          <p className="text-xs font-semibold text-purple mb-0.5">
            Bài {lesson.order}
          </p>
        )}
        <p className="font-bold text-dark-blue dark:text-white">{lesson.name}</p>
        {lesson.description && (
          <p className="text-xs text-gray-navy dark:text-light-blue mt-1 line-clamp-2">
            {lesson.description}
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSelect(lesson, "practice")}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-green/15 text-green hover:bg-green/25 transition"
        >
          ✏️ Luyện tập
        </button>
        <button
          onClick={() => onSelect(lesson, "test")}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-purple/10 text-purple hover:bg-purple/20 transition"
        >
          📝 Kiểm tra
        </button>
      </div>
    </div>
  );
}

/* ──────────── Test mode: chọn nhiều bài học ────────────── */
function TestModeSelector({
  lessons,
  initialLesson,
  onStart,
  onCancel,
  loading,
  error,
}: {
  lessons: Lesson[];
  initialLesson: Lesson;
  onStart: (lessonIds: string[], limit: number) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set([initialLesson.id]));
  const [limit, setLimit] = useState(15);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-white dark:bg-dark-blue rounded-2xl shadow-xl p-6 w-full max-w-md">
      <h2 className="text-lg font-bold text-dark-blue dark:text-white mb-1">
        Kiểm tra theo bài học
      </h2>
      <p className="text-xs text-gray-navy dark:text-light-blue mb-4">
        Chọn một hoặc nhiều bài học. Câu hỏi loại Kiểm tra sẽ được lấy ngẫu nhiên.
      </p>

      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {lessons.map((l) => (
          <label
            key={l.id}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
              selected.has(l.id)
                ? "border-purple bg-purple/5"
                : "border-slate/20 dark:border-white/10 hover:bg-slate/5 dark:hover:bg-white/5"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(l.id)}
              onChange={() => toggle(l.id)}
              className="accent-purple"
            />
            <div>
              {l.order > 0 && (
                <span className="text-xs text-purple font-semibold">Bài {l.order} · </span>
              )}
              <span className="text-sm font-medium text-dark-blue dark:text-white">{l.name}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
          Số câu hỏi
        </label>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full rounded-lg border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-2 text-sm"
        >
          {[5, 10, 15, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              {n} câu
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
        >
          Huỷ
        </button>
        <button
            onClick={() => onStart(Array.from(selected), limit)}
          disabled={selected.size === 0 || loading}
          className="flex-1 py-2 rounded-xl text-sm font-bold bg-purple text-white hover:bg-purple/80 disabled:opacity-50 transition"
        >
          {loading ? "Đang tải…" : "Bắt đầu kiểm tra"}
        </button>
      </div>
    </div>
  );
}

/* ──────────── Practice Game ────────────────────────────── */
function PracticeGame() {
  const {
    questions,
    currentQuestion,
    loading,
    hasFinished,
    selectAnswer,
    goNext,
    goPrev,
    finish,
    reset,
  } = usePracticeStore();

  const question = questions[currentQuestion];
  const totalAnswered = questions.filter((q) => q.userSelectedOptionId).length;

  if (!question) return null;

  if (hasFinished) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate p-10 rounded-2xl shadow-lg text-center max-w-sm w-full">
          <p className="text-5xl mb-3">✅</p>
          <p className="text-xl font-bold text-dark-blue dark:text-white">Hoàn thành!</p>
          <p className="text-sm text-gray-navy dark:text-light-blue mt-1">
            Đã trả lời {totalAnswered} / {questions.length} câu
          </p>
          <button
            onClick={reset}
            className="mt-6 px-6 py-2 bg-purple text-white rounded-xl font-medium hover:bg-purple/80 transition"
          >
            Luyện tập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh]">
      <ImageBackground />
      <MaxWidthWrapper className="flex items-center justify-center min-h-[80vh] py-6">
        <div className="w-full max-w-2xl flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-navy dark:text-light-blue">
              Câu {currentQuestion + 1} / {questions.length}
            </span>
            <span className="text-sm text-gray-navy dark:text-light-blue">
              Đã trả lời: {totalAnswered}
            </span>
          </div>

          {/* Question */}
          <div className="bg-white dark:bg-dark-blue rounded-2xl p-6 shadow-sm">
            <p
              className="text-dark-blue dark:text-white font-medium leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: renderMathInHTML(question.content),
              }}
            />
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((opt, i) => {
              const selected = question.userSelectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => selectAnswer(question.question_id, opt.id)}
                  className={`w-full text-left px-5 py-3 rounded-xl font-medium transition-colors border text-sm ${
                    selected
                      ? "bg-purple text-white border-purple"
                      : "bg-white dark:bg-slate/20 text-dark-blue dark:text-white border-slate/20 hover:border-purple/50"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: `<span class="font-bold mr-2">${String.fromCharCode(
                      65 + i
                    )}.</span>${renderMathInHTML(opt.text)}`,
                  }}
                />
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentQuestion === 0}
              className="px-4 py-2 rounded-lg bg-slate/10 dark:bg-white/10 text-sm font-medium disabled:opacity-40 hover:bg-slate/20 dark:hover:bg-white/20 transition"
            >
              ← Trước
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={goNext}
                className="px-4 py-2 rounded-lg bg-slate/10 dark:bg-white/10 text-sm font-medium hover:bg-slate/20 dark:hover:bg-white/20 transition"
              >
                Tiếp →
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={loading || hasFinished}
                className="px-6 py-2 rounded-lg bg-green text-dark-blue font-bold text-sm disabled:opacity-50 hover:bg-green/80 transition"
              >
                {loading ? "Đang nộp…" : "Hoàn thành"}
              </button>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}

/* ──────────── Main Page ────────────────────────────────── */
export default function PracticePage() {
  const { data: lessons = [], isLoading } = useLessons();
  const store = usePracticeStore();
  const [testLesson, setTestLesson] = useState<Lesson | null>(null);

  // Đang trong game
  if (store.sessionId && store.questions.length > 0) {
    return <PracticeGame />;
  }

  // Modal chọn bài học kiểm tra
  if (testLesson) {
    return (
      <div className="relative min-h-screen">
        <ImageBackground />
        <MaxWidthWrapper className="flex items-center justify-center min-h-[80vh]">
          <TestModeSelector
            lessons={lessons}
            initialLesson={testLesson}
            onStart={async (lessonIds, limit) => {
              await store.startSession({ lessonIds, limit, mode: "test" });
            }}
            onCancel={() => setTestLesson(null)}
            loading={store.loading}
            error={store.error}
          />
        </MaxWidthWrapper>
      </div>
    );
  }

  async function handleSelectLesson(lesson: Lesson, mode: PracticeMode) {
    if (mode === "test") {
      setTestLesson(lesson);
      return;
    }
    await store.startSession({ lessonId: lesson.id, limit: 10, mode: "practice" });
  }

  return (
    <div className="relative">
      <ImageBackground />
      <MaxWidthWrapper className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-blue dark:text-white">
            Luyện tập
          </h1>
          <p className="text-sm text-gray-navy dark:text-light-blue mt-1">
            Chọn bài học để luyện tập hoặc kiểm tra
          </p>
        </div>

        {store.error && (
          <div className="mb-4 p-3 rounded-xl bg-red/10 text-red text-sm">
            {store.error}
          </div>
        )}

        {isLoading && (
          <p className="text-gray-navy dark:text-light-blue text-sm">Đang tải…</p>
        )}

        {!isLoading && lessons.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-navy dark:text-light-blue text-sm">
              Chưa có bài học nào được tạo.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onSelect={handleSelectLesson}
            />
          ))}
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
