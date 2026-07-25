"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  useAttempt, 
  usePatchAnswers, 
  useSubmitAttempt,
} from "@/lib/queries";
import { parseICT } from "@/lib/utils";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle,
  Menu,
  X,
  AlertTriangle,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { useAntiCheat, VIOLATION_MESSAGES } from "@/hooks/use-anti-cheat";

export default function TestEnvironmentPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const examId = params.id as string;

  // Data fetching
  const { data, isLoading: loadingAttempt, error } = useAttempt(attemptId);
  const patchAnswers = usePatchAnswers();
  const submitAttempt = useSubmitAttempt();

  // Local state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states (replacing native confirm/alert)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [notification, setNotification] = useState<{ title: string; message: string; type: "info" | "error" | "warning" } | null>(null);

  const prevAnswersRef = useRef<Record<string, string | null>>({});

  // ─── Anti-cheat hook (7 layers) ───
  const antiCheat = useAntiCheat({
    attemptId,
    isActive: !!data && data.attempt?.status === "IN_PROGRESS" && timeLeft !== null,
    isSubmitting,
    onAutoSubmitted: async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        // Sync any unsaved answers before the attempt is finalized
        const changedIds = Object.keys(answers).filter(id => answers[id] !== prevAnswersRef.current[id]);
        if (changedIds.length > 0) {
          const payload = changedIds.map(id => ({
            question_id: id,
            selected_option_id: answers[id]
          }));
          await patchAnswers.mutateAsync({ attemptId, answers: payload });
        }
        // Submit the attempt (scores it server-side)
        await submitAttempt.mutateAsync(attemptId);
      } catch {
        // Attempt may already be submitted by the backend event handler — that's OK
      }
      setNotification({ title: "Tự động nộp bài", message: "Bạn đã phạm quy quá số lần cho phép. Bài thi đã được tự động nộp.", type: "error" });
    },
  });

  const doSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const changedIds = Object.keys(answers).filter(id => answers[id] !== prevAnswersRef.current[id]);
      if (changedIds.length > 0) {
        const payload = changedIds.map(id => ({
          question_id: id,
          selected_option_id: answers[id]
        }));
        await patchAnswers.mutateAsync({ attemptId, answers: payload });
      }
      await submitAttempt.mutateAsync(attemptId);
      router.push("/exams");
    } catch (err: any) {
      setNotification({ title: "Lỗi nộp bài", message: err.message || "Nộp bài thất bại. Vui lòng thử lại.", type: "error" });
      setIsSubmitting(false);
      antiCheat.enterFullScreen();
    }
  }, [attemptId, answers, patchAnswers, submitAttempt, router, antiCheat]);

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const changedIds = Object.keys(answers).filter(id => answers[id] !== prevAnswersRef.current[id]);
      if (changedIds.length > 0) {
        const payload = changedIds.map(id => ({
          question_id: id,
          selected_option_id: answers[id]
        }));
        await patchAnswers.mutateAsync({ attemptId, answers: payload });
      }
      await submitAttempt.mutateAsync(attemptId);
      setNotification({ title: "Hết giờ", message: "Hết giờ làm bài. Bài thi đã được nộp tự động.", type: "warning" });
    } catch (err) {
      console.error(err);
      router.push("/exams");
    }
  }, [attemptId, isSubmitting, router, submitAttempt, answers, patchAnswers]);

  // Initialize answers and timer from data
  useEffect(() => {
    if (data?.attempt) {
      // If already completed, redirect to results (TBD) or home
      if (data.attempt.status === "COMPLETED") {
        router.push("/exams");
        return;
      }

      // Timer
      const expiresAt = parseICT(data.attempt.expires_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(diff);

      // Restore saved answers from server (reconnect / page reload)
      if (data.saved_answers && data.saved_answers.length > 0) {
        const restored: Record<string, string | null> = {};
        for (const a of data.saved_answers) {
          restored[a.question_id] = a.selected_option_id ?? null;
        }
        setAnswers(prev => {
          // Merge: keep any local answers that are newer, fill in from server
          const merged = { ...restored, ...prev };
          prevAnswersRef.current = { ...merged };
          return merged;
        });
      }
    }
  }, [data, router]);

  // Tick timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitting) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting, handleAutoSubmit]);

  // Anti-cheat is now handled by the useAntiCheat hook above

  // Auto-save logic (Debounced)
  useEffect(() => {
    if (isSubmitting) return;
    const changedIds = Object.keys(answers).filter(id => answers[id] !== prevAnswersRef.current[id]);
    if (changedIds.length === 0) return;

    const timeout = setTimeout(() => {
      if (isSubmitting) return;
      const payload = changedIds.map(id => ({
        question_id: id,
        selected_option_id: answers[id]
      }));
      patchAnswers.mutate({ attemptId, answers: payload });
      prevAnswersRef.current = { ...answers };
    }, 1500);

    return () => clearTimeout(timeout);
  }, [answers, attemptId, patchAnswers, isSubmitting]);

  // Navigation Guarding
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);



  const handleSubmit = () => {
    setShowConfirmSubmit(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (error) {
     return <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black p-6">
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
     </div>;
  }

  if (loadingAttempt || timeLeft === null) {
     return <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-black">
       <div className="flex flex-col items-center gap-4">
         <div className="size-16 border-4 border-primary border-t-transparent animate-spin rounded-full" />
         <p className="font-bold text-primary animate-pulse">Hệ thống đang nạp dữ liệu...</p>
       </div>
     </div>;
  }

  const questions = data?.questions || [];
  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-black flex flex-col overflow-hidden z-[100]">
      {/* Top Header */}
      <header className="h-20 bg-white dark:bg-navy-blue border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-6 md:px-12 z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
           <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-black text-xs">AI</span>
           </div>
           <div className="hidden md:block">
             <h2 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider line-clamp-1 max-w-[300px]">
               {data?.attempt?.exam_id && "KỲ THI ĐANG DIỄN RA"}
             </h2>
             <p className="text-[10px] font-bold text-gray-navy uppercase opacity-40">Phòng thi DUT AI Manager</p>
           </div>
        </div>

        <div className={cn(
          "flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black text-xl transition-colors shrink-0",
          timeLeft < 300 ? "bg-red/10 text-red animate-pulse" : "bg-gray-50 dark:bg-white/5 text-dark-blue dark:text-white"
        )}>
          <Clock className="size-6" />
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Send className="size-4" />
          NỘP BÀI
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Question Navigator (Desktop only or Drawer) */}
        <aside className={cn(
          "absolute inset-y-0 left-0 w-80 bg-white dark:bg-navy-blue border-r border-gray-100 dark:border-white/5 transition-transform duration-300 z-40 p-6 flex flex-col gap-6",
          showNavigator ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}>
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-gray-navy opacity-40 tracking-widest italic">Danh sách câu hỏi</h3>
              <button onClick={() => setShowNavigator(false)} className="lg:hidden"><X className="size-5" /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-full">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                        setCurrentIndex(i);
                        setShowNavigator(false);
                    }}
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center text-xs font-black transition-all border",
                      currentIndex === i 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : answers[questions[i].question_id] 
                          ? "bg-primary/10 text-primary border-primary/30" 
                          : "bg-gray-50 dark:bg-white/5 text-gray-navy border-transparent"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
           </div>

           <div className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-60">
                 <span>Tiến độ</span>
                 <span>{Object.keys(answers).filter(id => answers[id]).length}/{questions.length}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-500" 
                   style={{ width: `${(Object.keys(answers).filter(id => answers[id]).length / questions.length) * 100}%` }}
                 />
              </div>
           </div>
        </aside>

        {/* Backdrop for navigator */}
        <AnimatePresence>
          {showNavigator && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNavigator(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Right Side: Question Display */}
        <main className="flex-1 flex flex-col relative min-w-0 lg:ml-80">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-8 py-8 md:py-12">
            <div className="w-full max-w-[1400px] mx-auto space-y-10">
               {/* Question Header */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <span className="size-8 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center">
                        {currentIndex + 1}
                     </span>
                     <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">CÂU HỎI TRẮC NGHIỆM</h3>
                  </div>
                  <Markdown 
                    content={currentQuestion?.content || ""}
                    className="text-xl md:text-2xl font-bold text-dark-blue dark:text-white leading-relaxed question-content select-none"
                  />
               </div>

               {/* Options */}
               <div className="grid grid-cols-1 gap-4">
                  {currentQuestion?.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.question_id]: opt.id }))}
                      className={cn(
                        "group flex items-center gap-6 p-6 md:p-8 rounded-[2rem] border-2 transition-all text-left",
                        answers[currentQuestion.question_id] === opt.id
                          ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                          : "bg-white dark:bg-navy-blue border-gray-100 dark:border-white/5 text-gray-navy hover:border-primary/30"
                      )}
                    >
                       <div className={cn(
                         "size-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-black text-xs",
                         answers[currentQuestion.question_id] === opt.id
                           ? "border-primary bg-primary text-white"
                           : "border-gray-200 dark:border-white/10 group-hover:border-primary/50"
                       )}>
                         {String.fromCharCode(65 + currentQuestion.options.indexOf(opt))}
                       </div>
                        <Markdown 
                          content={opt.text || ""}
                          className="text-base md:text-lg font-bold leading-relaxed"
                        />
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Bottom Controls */}
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
                  onClick={() => setCurrentIndex(prev => prev - 1)}
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
                  onClick={() => setCurrentIndex(prev => prev + 1)}
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
      {!antiCheat.isFullScreen && !isSubmitting && data?.attempt?.status === "IN_PROGRESS" && (
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
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-navy-blue rounded-[3rem] p-10 max-w-lg w-full text-center space-y-6 shadow-2xl border border-primary/20"
            >
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Send className="size-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tighter">Xác nhận nộp bài</h2>
                <p className="text-gray-navy dark:text-light-blue/60 text-sm">
                  Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời.
                </p>
                <p className="text-xs text-gray-navy/50 dark:text-light-blue/40">
                  Đã trả lời: <span className="font-bold text-primary">{Object.keys(answers).filter(id => answers[id]).length}</span> / {questions.length} câu
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-navy dark:text-white rounded-[2rem] font-black text-sm active:scale-95 transition-all"
                >
                  TIẾP TỤC LÀM BÀI
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    doSubmit();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-primary text-white rounded-[2rem] font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "ĐANG NỘP..." : "NỘP BÀI NGAY"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  router.push("/exams");
                }}
                className={cn(
                  "w-full py-5 text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all",
                  notification.type === "error" ? "bg-red shadow-red/20" : notification.type === "warning" ? "bg-yellow-500 shadow-yellow-500/20" : "bg-primary shadow-primary/20"
                )}
              >
                QUAY VỀ DANH SÁCH
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
