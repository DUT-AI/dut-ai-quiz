"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAttempt } from "@/lib/queries";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Menu,
  AlertTriangle,
  Shield,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAntiCheat, VIOLATION_MESSAGES } from "@/hooks/use-anti-cheat";
import {
  ExamHeader,
  QuestionCard,
  QuestionNavigator,
  SubmitConfirmationModal,
  useExamTimer,
  useExamSession,
} from "@/features/attempts";

export default function TestEnvironmentPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  // Data fetching
  const { data, isLoading: loadingAttempt, error } = useAttempt(attemptId);

  // Local navigation state
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window === "undefined" || !attemptId) return 0;
    try {
      const saved = localStorage.getItem(`exam_idx_${attemptId}`);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch {
      // ignore
    }
    return 0;
  });
  const [showNavigator, setShowNavigator] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: "info" | "error" | "warning";
  } | null>(null);

  const handleIndexChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
    if (typeof window !== "undefined" && attemptId) {
      try {
        localStorage.setItem(`exam_idx_${attemptId}`, String(newIndex));
      } catch {
        // ignore
      }
    }
  }, [attemptId]);

  // Exam session hook (answers, debounced auto-save, submit)
  const session = useExamSession({
    attemptId,
    initialAnswers: data?.saved_answers,
  });

  // Countdown timer hook with server clock skew compensation
  const timer = useExamTimer({
    expiresAt: data?.attempt?.expires_at,
    serverTime: (data as any)?.server_time,
    isSubmitting: session.isSubmitting,
    onExpire: async () => {
      await session.autoSubmit();
      setNotification({
        title: "Hết giờ",
        message: "Hết giờ làm bài. Bài thi đã được nộp tự động.",
        type: "warning",
      });
    },
  });

  // Anti-cheat hook (7 layers)
  const antiCheat = useAntiCheat({
    attemptId,
    isActive: !!data && data.attempt?.status === "IN_PROGRESS" && timer.timeLeft !== null,
    isSubmitting: session.isSubmitting,
    onAutoSubmitted: async () => {
      await session.autoSubmit();
      setNotification({
        title: "Tự động nộp bài",
        message: "Bạn đã phạm quy quá số lần cho phép. Bài thi đã được tự động nộp.",
        type: "error",
      });
    },
  });

  // If already completed, redirect to review or exams
  useEffect(() => {
    if (data?.attempt?.status === "COMPLETED") {
      router.push(`/history/${attemptId}/review`);
    }
  }, [data, attemptId, router]);

  const questions = (data?.questions || []) as any[];

  // Clamp index if stored index is out of bounds
  useEffect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      handleIndexChange(0);
    }
  }, [questions.length, currentIndex, handleIndexChange]);

  const handleManualSubmit = useCallback(async () => {
    setShowConfirmSubmit(false);
    const res = await session.submit();
    if (res.success) {
      router.push(`/history/${attemptId}/review`);
    } else {
      setNotification({
        title: "Lỗi nộp bài",
        message: res.error || "Nộp bài thất bại. Vui lòng thử lại.",
        type: "error",
      });
      antiCheat.enterFullScreen();
    }
  }, [session, attemptId, router, antiCheat]);

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="size-20 rounded-full bg-red/10 flex items-center justify-center mx-auto">
            <AlertCircle className="size-10 text-red" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase">Lỗi nạp bài thi</h2>
            <p className="text-gray-navy dark:text-light-blue/60 font-medium">
              {(error as any).response?.data?.detail || (error as any).message || "Không thể kết nối với máy chủ."}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all"
          >
            THỬ LẠI
          </button>
          <button 
            onClick={() => router.push("/exams")}
            className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-navy dark:text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
          >
            QUAY LẠI DANH SÁCH
          </button>
        </div>
      </div>
    );
  }

  if (loadingAttempt || timer.timeLeft === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 border-4 border-primary border-t-transparent animate-spin rounded-full" />
          <p className="font-bold text-primary animate-pulse">Hệ thống đang nạp dữ liệu...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.question_id || currentQuestion?.id;

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-black flex flex-col overflow-hidden z-[100]">
      {/* Top Header */}
      <ExamHeader
        title="KỲ THI ĐANG DIỄN RA"
        timeLeft={timer.timeLeft}
        formatTime={timer.formatTime}
        onSubmitClick={() => setShowConfirmSubmit(true)}
        isSubmitting={session.isSubmitting}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <QuestionNavigator
          questions={questions}
          currentIndex={currentIndex}
          answers={session.answers}
          isOpen={showNavigator}
          onClose={() => setShowNavigator(false)}
          onSelectIndex={handleIndexChange}
        />

        {/* Right Side: Question Display */}
        <main className="flex-1 flex flex-col relative min-w-0 lg:ml-80">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-8 py-8 md:py-12">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                index={currentIndex}
                selectedOptionId={session.answers[currentQuestionId] ?? null}
                onSelectOption={(optId) => session.setAnswer(currentQuestionId, optId)}
              />
            )}
          </div>

          {/* Bottom Pagination Controls */}
          <footer className="h-24 bg-white dark:bg-navy-blue border-t border-gray-100 dark:border-white/5 flex items-center justify-between px-6 md:px-12 shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNavigator(true)}
                className="lg:hidden p-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-navy"
              >
                <Menu className="size-6" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                disabled={currentIndex === 0}
                onClick={() => handleIndexChange(currentIndex - 1)}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-gray-navy hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-5" />
                TRƯỚC
              </button>
              
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 font-black text-xs text-gray-navy opacity-40">
                {currentIndex + 1} / {questions.length}
              </div>

              <button 
                disabled={currentIndex === questions.length - 1}
                onClick={() => handleIndexChange(currentIndex + 1)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-dark-blue dark:bg-white/10 text-white font-bold hover:scale-[1.02] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                TIẾP THEO
                <ChevronRight className="size-5" />
              </button>
            </div>

            <div className="hidden md:block w-32" />
          </footer>
        </main>
      </div>

      {/* FullScreen Enforcement Overlay */}
      {!antiCheat.isFullScreen && !session.isSubmitting && data?.attempt?.status === "IN_PROGRESS" && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8">
            <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Shield className="size-12 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Yêu cầu Toàn màn hình</h2>
              <p className="text-gray-400 font-medium">
                Để đảm bảo tính công bằng, bài thi yêu cầu hoạt động ở chế độ toàn màn hình. 
                Vui lòng quay lại để tiếp tục làm bài.
              </p>
              <div className="text-xs text-gray-500 space-y-1 text-left bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="font-bold text-white/70">⚠️ Hệ thống giám sát 7 lớp bảo vệ:</p>
                <p>• Phát hiện chuyển tab / ẩn cửa sổ</p>
                <p>• Phát hiện extension gian lận (Always Active Tab)</p>
                <p>• Phát hiện mở Developer Tools</p>
                <p>• Chặn phím tắt, copy, chuột phải</p>
              </div>
            </div>
            <button 
              onClick={antiCheat.enterFullScreen}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all"
            >
              VÀO CHẾ ĐỘ TOÀN MÀN HÌNH
            </button>
          </div>
        </div>
      )}

      {/* Violation Modal */}
      <AnimatePresence>
        {antiCheat.showViolationModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-navy-blue rounded-[3rem] p-10 max-w-lg w-full text-center space-y-6 shadow-2xl border border-red/20"
            >
              <div className="size-20 rounded-full bg-red/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="size-10 text-red" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-red uppercase tracking-tighter">PHÁT HIỆN VI PHẠM!</h2>
                <p className="text-dark-blue dark:text-white font-bold text-sm bg-red/5 py-3 px-4 rounded-2xl border border-red/10">
                  Lỗi: {antiCheat.violationType ? VIOLATION_MESSAGES[antiCheat.violationType] : "Phát hiện hành động bất thường."}
                </p>
                <p className="text-gray-navy dark:text-light-blue/60 text-xs">
                  Hành động này được hệ thống ghi nhận là vi phạm nghiêm trọng. <br/>
                  <span className="text-red font-black underline italic">Lưu ý: Nếu vi phạm lần thứ 3, bài thi sẽ được nộp TỰ ĐỘNG ngay lập tức.</span>
                </p>
              </div>
              <button 
                onClick={antiCheat.dismissViolation}
                className="w-full py-5 bg-red text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                XÁC NHẬN VÀ QUAY LẠI
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={showConfirmSubmit}
        answeredCount={session.answeredCount}
        totalQuestions={questions.length}
        isSubmitting={session.isSubmitting}
        onCancel={() => setShowConfirmSubmit(false)}
        onConfirm={handleManualSubmit}
      />

      {/* Notification Modal (replaces alert) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[230] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={cn(
                "rounded-[3rem] p-10 max-w-lg w-full text-center space-y-6 shadow-2xl border",
                notification.type === "error"
                  ? "bg-white dark:bg-navy-blue border-red/20"
                  : notification.type === "warning"
                    ? "bg-white dark:bg-navy-blue border-yellow-500/20"
                    : "bg-white dark:bg-navy-blue border-primary/20"
              )}
            >
              <div className={cn(
                "size-20 rounded-full flex items-center justify-center mx-auto",
                notification.type === "error" ? "bg-red/10" : notification.type === "warning" ? "bg-yellow-500/10" : "bg-primary/10"
              )}>
                {notification.type === "error" ? (
                  <AlertTriangle className="size-10 text-red" />
                ) : notification.type === "warning" ? (
                  <Clock className="size-10 text-yellow-500" />
                ) : (
                  <AlertCircle className="size-10 text-primary" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className={cn(
                  "text-2xl font-black uppercase tracking-tighter",
                  notification.type === "error" ? "text-red" : notification.type === "warning" ? "text-yellow-600 dark:text-yellow-400" : "text-dark-blue dark:text-white"
                )}>
                  {notification.title}
                </h2>
                <p className="text-gray-navy dark:text-light-blue/60 text-sm font-medium">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => {
                  setNotification(null);
                  router.push(`/history/${attemptId}/review`);
                }}
                className={cn(
                  "w-full py-5 text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all",
                  notification.type === "error" ? "bg-red shadow-red/20" : notification.type === "warning" ? "bg-yellow-500 shadow-yellow-500/20" : "bg-primary shadow-primary/20"
                )}
              >
                XEM KẾT QUẢ BÀI THI
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
