"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Skull, Trophy, Lock, Heart, Shield, Zap, BookOpen } from "lucide-react";
import { toast } from "sonner";

import BossHud from "./boss-hud";
import ItemHotbar, { ItemType } from "./item-hotbar";
import GameQuestionCard from "./game-question-card";
import GameResult from "./game-result";
import { useThemeStore } from "@/store/theme-store";
import SwitchTheme from "@/components/atoms/switch-theme";

import {
  useStartGameSession,
  usePatchGameAnswer,
  useUseGameItem,
  useActiveGameSession,
} from "../queries";
import { type GameQuestion, type GamificationState } from "../types";

const getBossName = (stageNum: number) => {
  if (stageNum === 1) return "SLIME CHÚA";
  if (stageNum === 2) return "MA BÀN THẠCH";
  return "MA NHÃN TỐI THƯỢNG";
};

interface GameContainerProps {
  lessonSlug: string;
  initialSession: any; // StartGameSessionResponse | null
}

export default function GameContainer({ lessonSlug, initialSession }: GameContainerProps) {
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const { darkMode } = useThemeStore();
  const { refetch: refetchActiveSession } = useActiveGameSession(lessonSlug, { enabled: false });

  const gameBackgroundStyle = useMemo(() => {
    return {
      backgroundImage: darkMode
        ? `radial-gradient(circle, rgba(255,255,255,0.02) 1.5px, transparent 1.5px),
           linear-gradient(to bottom right, #09090b, #030712)`
        : `radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px),
           linear-gradient(to bottom right, #f4eedb, #eae2c6)`,
      backgroundSize: "24px 24px, 100% 100%",
      backgroundAttachment: "fixed",
    };
  }, [darkMode]);

  // Mutations
  const startSessionMutation = useStartGameSession();
  const patchAnswerMutation = usePatchGameAnswer();
  const useItemMutation = useUseGameItem();

  // Game core state
  const [screen, setScreen] = useState<"start" | "playing" | "result">("start");
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [gamification, setGamification] = useState<GamificationState | null>(null);

  // Derived state from questions & gamification
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hp, setHp] = useState(3);
  const [gold, setGold] = useState(0);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIdx];
  const stage = currentQuestion?.tier || 1;
  const timerMax = currentQuestion?.time_limit || (currentQuestion?.is_boss ? 30 : 60);

  // Boss Battle state
  const [bossHp, setBossHp] = useState(5);
  const [bossMaxHp, setBossMaxHp] = useState(5);
  const [bossStatus, setBossStatus] = useState<"idle" | "attack" | "damage" | "defeat">("idle");
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);

  // Client items state
  const [shieldActive, setShieldActive] = useState(false);
  const [doubleActive, setDoubleActive] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSelectedCorrect, setIsSelectedCorrect] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);

  // Timer state
  const [countdown, setCountdown] = useState<number | null>(null);
  const timeLeftRef = useRef(60);
  const [timerFrozen, setTimerFrozen] = useState(false);

  // Right column ref for auto-scrolling
  const rightColRef = useRef<HTMLDivElement | null>(null);

  // Sync timeLeft when current question changes
  useEffect(() => {
    if (currentQuestion) {
      timeLeftRef.current = currentQuestion.time_limit;
    }
  }, [currentIdx, currentQuestion]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
      }, 800);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  // Scroll to bottom of right column when question is answered
  useEffect(() => {
    if (isAnswered && rightColRef.current) {
      const timer = setTimeout(() => {
        rightColRef.current?.scrollTo({
          top: rightColRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAnswered]);

  // Scroll back to top when question changes
  useEffect(() => {
    if (rightColRef.current) {
      rightColRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [currentIdx]);

  // Visual effects
  const [screenShake, setScreenShake] = useState(false);
  const [gameResult, setGameResult] = useState<"playing" | "victory" | "defeat">("playing");
  const [stageProgress, setStageProgress] = useState<("correct" | "incorrect" | "idle")[]>([]);



  // Initialize game state from session data
  const initializeGame = (sessionData: { session_id: string; snapshot: any }) => {
    try {
      console.log("[GameDebug] initializeGame called with data:", sessionData);
      const snap = sessionData.snapshot;
      if (!snap) {
        throw new Error("Dữ liệu snapshot không hợp lệ (null/undefined)!");
      }
      setSessionId(sessionData.session_id);


      setQuestions(snap.questions || []);
      setGamification(snap.gamification);

      // Reset all answer states
      setIsAnswered(false);
      setSelectedOptionId(null);
      setHiddenOptions([]);
      setTimerFrozen(false);
      setDoubleActive(false);
      setShieldActive(false);
      setIsSelectedCorrect(false);
      setCorrectOptionId(null);

      const gamificationState = snap.gamification || {};
      const idx = gamificationState.last_question_index || 0;
      setCurrentIdx(idx);

      if (idx === 0) {
        setCountdown(3);
      } else {
        setCountdown(null);
      }
      setHp(gamificationState.lives ?? 3);
      setGold(gamificationState.gold ?? 0);
      setScore(gamificationState.points ?? 0);

      // Reconstruct progress dots based on answers
      const totalQCount = (snap.questions || []).length;
      const progress: ("correct" | "incorrect" | "idle")[] = Array.from({ length: totalQCount }).map(() => "idle");
      for (let i = 0; i < idx; i++) {
        progress[i] = "correct"; 
      }
      setStageProgress(progress);

      // Check if the current question is a boss fight
      const currentQ = (snap.questions || [])[idx];
      if (currentQ) {
        const bossMode = currentQ.is_boss;
        setIsBossMode(bossMode);
        setBossHp(gamificationState.boss_hp === 1 ? 5 : 0);
        setBossMaxHp(5);
      }

      setGameResult("playing");
      setScreen("playing");
      console.log("[GameDebug] initializeGame completed successfully, screen set to playing");
    } catch (err: any) {
      console.error("[GameDebug] initializeGame CRITICAL ERROR:", err);
      toast.error(`Lỗi khởi tạo game: ${err.message || err}`);
      router.push(`/lessons/${lessonSlug}`);
    }
  };

  // Auto-initialize game session based on query params (continue or new game)
  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (initialSession) {
      console.log("[GameDebug] Initializing game with active session data:", initialSession);
      hasInitializedRef.current = true;
      initializeGame(initialSession);
    } else {
      console.log("[GameDebug] Initializing game: starting new session");
      hasInitializedRef.current = true;
      startSessionMutation.mutate(
        { lesson_slug: lessonSlug },
        {
          onSuccess: (data) => {
            console.log("[GameDebug] startSessionMutation Success", data);
            initializeGame(data);
          },
          onError: (err: any) => {
            console.error("[GameDebug] startSessionMutation Error", err);
            toast.error(err.message || "Không thể khởi tạo đấu trường!");
            router.push(`/lessons/${lessonSlug}`);
          },
        }
      );
    }
  }, [initialSession, lessonSlug, router]);

  // Handle timeout
  const handleTimeOut = () => {
    toast.error("Hết thời gian suy nghĩ mất rồi!");
    submitAnswer("");
  };

  // Submit answer
  const submitAnswer = (optionId: string) => {
    if (isAnswered || patchAnswerMutation.isPending) return;
    setSelectedOptionId(optionId);

    const currentQuestion = questions[currentIdx];
    if (!currentQuestion) return;

    // Calculate response time
    const timeResponse = timerMax - timeLeftRef.current;

    // Call API patch answer
    patchAnswerMutation.mutate(
      {
        session_id: sessionId,
        question_id: currentQuestion.id,
        option_id: optionId,
        time_response: timeResponse,
        activate_shield: shieldActive,
        activate_double_points: doubleActive,
      },
      {
        onSuccess: (data) => {
          setIsSelectedCorrect(data.is_correct);
          setCorrectOptionId(data.correct_option_id ?? null);
          setIsAnswered(true);
          setGamification(data.updated_gamification);

          // Update metrics from response
          setGold(data.updated_gamification.gold);
          setScore(data.updated_gamification.points);
          setHp(data.updated_gamification.lives);

          // Play effects
          if (data.is_correct) {
            toast.success("Chính xác! Bạn nhận được vàng thưởng.");
            setBossStatus("damage");
            
            // If boss was active, correct answer defeats it
            if (isBossMode) {
              setBossHp(0);
              setTimeout(() => {
                setBossStatus("defeat");
              }, 350);
              setTimeout(() => {
                toast.success(`Đã tiêu diệt ${getBossName(stage)}! HP +2 mạng.`);
              }, 800);
            }

            setStageProgress((prev) => {
              const copy = [...prev];
              copy[currentIdx] = "correct";
              return copy;
            });
          } else {
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 500);
            
            setBossStatus("attack");
            setTimeout(() => setBossStatus("idle"), 1000);

            if (shieldActive) {
              toast.info("Khiên hộ mệnh vỡ tan! Bảo toàn sinh mệnh.");
            } else {
              toast.error(isBossMode ? "Sai rồi! Boss tấn công làm mất 2 mạng." : "Chọn sai rồi! Mất 1 mạng.");
            }

            setStageProgress((prev) => {
              const copy = [...prev];
              copy[currentIdx] = "incorrect";
              return copy;
            });
          }

          // Check if game over
          if (data.is_game_over) {
            setTimeout(() => {
              setGameResult(data.updated_gamification.lives <= 0 ? "defeat" : "victory");
              setScreen("result");
            }, 1200);
          }

          // Reset local flags
          setShieldActive(false);
          setDoubleActive(false);
        },
        onError: (err: any) => {
          toast.error(err.message || "Lỗi nộp câu trả lời!");
          setIsAnswered(false);
          setSelectedOptionId(null);
        },
      }
    );
  };

  // Next Question
  const nextQuestion = () => {
    if (!gamification) return;

    const nextIdx = gamification.last_question_index;
    if (nextIdx >= questions.length || gamification.lives <= 0) {
      setGameResult(gamification.lives <= 0 ? "defeat" : "victory");
      setScreen("result");
      return;
    }

    refetchActiveSession().then(({ data: updatedSession }: any) => {
      if (updatedSession?.snapshot) {
        const updatedQuestions = updatedSession.snapshot.questions;
        setQuestions(updatedQuestions);

        // Check if we evolved stage
        const nextQ = updatedQuestions[nextIdx];
        if (nextQ) {
          if (currentQuestion && nextQ.tier > currentQuestion.tier) {
            toast.info(`ẢI TẦNG THỨ ${nextQ.tier}: MỨC ĐỘ ${nextQ.tier === 2 ? "TRUNG BÌNH" : "KHÓ"}`);
          }

          if (nextQ.is_boss) {
            setIsBossMode(true);
            setBossHp(5);
            setBossMaxHp(5);
            setBossStatus("idle");
            setShowBossWarning(true);
          } else {
            setIsBossMode(false);
            setBossHp(0);
          }
        }

        // Reset components states
        setCurrentIdx(nextIdx);
        setIsAnswered(false);
        setSelectedOptionId(null);
        setCorrectOptionId(null);
        setHiddenOptions([]);
        setTimerFrozen(false);
      }
    });
  };

  // Use Support Items
  const handleUseItem = (type: ItemType) => {
    if (!gamification || !questions[currentIdx]) return;
    const currentQ = questions[currentIdx];

    // Align pricing
    let cost = type === "50-50" ? 50 : type === "freeze" ? 40 : type === "double" ? 100 : 80;
    if (isBossMode) cost *= 2;

    if (gold < cost) {
      toast.error("Không đủ vàng rồi!");
      return;
    }

    // Shield limit check
    if (type === "shield") {
      const shieldUsed = gamification.shield_used_in_tier[String(stage)] || false;
      if (shieldUsed || shieldActive) {
        toast.error("Mỗi tầng chỉ được dùng tối đa 1 Khiên Hộ Mệnh!");
        return;
      }
    }

    // Microscope and Time Freeze require calling server API immediately
    if (type === "50-50" || type === "freeze") {
      const itemName = type === "50-50" ? "microscope" : "time_freeze";
      useItemMutation.mutate(
        { session_id: sessionId, item_name: itemName, question_id: currentQ.id },
        {
          onSuccess: (data) => {
            setGold(data.gold);
            if (gamification) {
              setGamification({
                ...gamification,
                gold: data.gold,
              });
            }

            if (type === "50-50") {
              setHiddenOptions(data.eliminated_option_ids);
              toast.info("Kính Hiển Vi kích hoạt! Loại bỏ 2 đáp án sai.");
            } else {
              setTimerFrozen(true);
              toast.info("Đóng Băng kích hoạt! Thời gian suy nghĩ tạm dừng (cộng 30s).");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Không thể sử dụng vật phẩm!");
          },
        }
      );
    } else {
      // Shield and Double points are activated client-side and sent during patch answer
      setGold((prev) => prev - cost);
      if (type === "shield") {
        setShieldActive(true);
        toast.info("Khiên Hộ Mệnh đã kích hoạt! Bảo vệ dũng sĩ ở câu trả lời này.");
      } else {
        setDoubleActive(true);
        toast.info("Bùa Nhân Phẩm đã kích hoạt! Nhân đôi điểm số câu hỏi này.");
      }
    }
  };

  // Replay retry
  const handleRetry = () => {
    // Directly start a new session — the backend's StartGameSessionUseCase
    // will auto-finish any IN_PROGRESS session before creating the new one.
    startSessionMutation.mutate(
      { lesson_slug: lessonSlug },
      {
        onSuccess: (data) => {
          initializeGame(data);
          toast.success("Trận đấu mới đã bắt đầu!");
        },
        onError: (err: any) => {
          toast.error(err.message || "Không thể bắt đầu trận đấu mới!");
        },
      }
    );
  };

  const isInitializing =
    startSessionMutation.isPending ||
    !hasInitializedRef.current;

  if (isInitializing) {
    return (
      <div
        className="min-h-screen text-zinc-955 dark:text-zinc-100 flex flex-col items-center justify-center font-sans relative select-none p-4 md:p-6"
        style={gameBackgroundStyle}
      >
        <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-extrabold text-lg text-zinc-700 dark:text-zinc-400 font-mono animate-pulse">
          ĐANG KHỞI TẠO ĐẤU TRƯỜNG...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`text-zinc-955 dark:text-zinc-100 flex flex-col font-sans relative select-none p-2 md:p-4 px-1.5 md:px-2 transition-all duration-300 h-screen overflow-y-auto custom-scrollbar game-layout-container ${
        screen === "playing" ? "lg:overflow-hidden" : ""
      } ${screenShake ? "animate-[shake_0.5s_infinite]" : ""}`}
      style={gameBackgroundStyle}
    >
      <style jsx global>{`
        html, body {
          height: 100% !important;
          overflow: hidden !important;
        }
        #__next, main, [data-nextjs-scroll-focus-boundary], #root, .dark, body > div {
          height: 100% !important;
          overflow: hidden !important;
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -2px) rotate(-0.5deg); }
          20% { transform: translate(2px, -1px) rotate(0.5deg); }
          30% { transform: translate(-3px, 1px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(0.5deg); }
          50% { transform: translate(-1px, 2px) rotate(-0.5deg); }
          60% { transform: translate(2px, 1px) rotate(0deg); }
          70% { transform: translate(-2px, -1px) rotate(0.5deg); }
          80% { transform: translate(1px, 2px) rotate(-0.5deg); }
          90% { transform: translate(-2px, -2px) rotate(0.5deg); }
        }
        @keyframes active-dot-pulse {
          0% {
            box-shadow: 0 0 0 0px rgba(245, 158, 11, 0.8);
          }
          100% {
            box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
          }
        }
        .animate-active-dot {
          animation: active-dot-pulse 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        .game-main-content {
          overflow: visible !important;
        }
        .game-layout-container {
          scrollbar-gutter: stable;
        }
        .game-right-column {
          scrollbar-gutter: stable;
        }
        @media (min-width: 1024px) and (max-height: 920px) {
          .game-layout-container {
            overflow-y: auto !important;
          }
          .game-main-content {
            height: auto !important;
            flex: none !important;
          }
          .game-grid-layout {
            height: auto !important;
          }
        }
      `}</style>

      {/* ─── TOP BAR (NAVIGATION & THEME SELECTOR) ─── */}
      <div className="w-full max-w-[98%] mx-auto flex justify-between items-center py-2 mb-2 px-1 relative z-20">
        <button
          onClick={() => router.push(`/lessons/${lessonSlug}`)}
          className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-bold uppercase tracking-wider bg-white dark:bg-navy-blue border-2 border-zinc-900 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-300 font-mono shadow-sm"
        >
          <BookOpen className="size-4" />
          <span>Quay lại Bài học</span>
        </button>
        <SwitchTheme />
      </div>

      {screen === "start" ? (
        <div className="flex-1 flex items-center justify-center font-mono text-zinc-500">
          <p className="animate-pulse">ĐANG KHỞI TẠO ĐẤU TRƯỜNG...</p>
        </div>
      ) : screen === "playing" ? (
        <>
          {/* ─── HEADER HUD (RPG STATUS BAR) ─── */}
          <header className="relative w-full max-w-[98%] mx-auto flex justify-between items-center bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-3 md:p-4 rounded-none mb-3 z-10 shadow-md">
            {/* Left Side: Stage progress dot */}
            <div className="flex flex-col items-start select-none">
              <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 mb-1 tracking-wider font-extrabold font-mono">
                TIẾN TRÌNH THỬ THÁCH
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-md md:max-w-none py-1">
                {stageProgress.map((status, i) => {
                  const isActive = i === currentIdx;
                  let icon = null;
                  let btnClass = "bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed";

                  if (isActive) {
                    icon = <Swords className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-zinc-900 dark:text-white animate-pulse" />;
                    btnClass = "bg-amber-400 dark:bg-amber-500 border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-white scale-110";
                  } else if (status === "correct") {
                    icon = <Trophy className="w-3 h-3 md:w-4 md:h-4 text-emerald-800 dark:text-emerald-300" />;
                    btnClass = "bg-emerald-400 dark:bg-emerald-650 border-zinc-900 dark:border-zinc-700";
                  } else if (status === "incorrect") {
                    icon = <Skull className="w-3 h-3 md:w-4 md:h-4 text-red-800 dark:text-red-300" />;
                    btnClass = "bg-red-400 dark:bg-red-650 border-zinc-900 dark:border-zinc-700";
                  } else {
                    icon = <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-400 dark:text-zinc-500" />;
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled
                      className={`relative w-8 h-8 md:w-10 md:h-10 border-2 transition-all duration-300 flex items-center justify-center rounded-none font-bold ${btnClass}`}
                    >
                      {isActive && (
                        <span className="absolute inset-0 rounded-none border-2 border-amber-500 dark:border-amber-400 animate-active-dot opacity-80 pointer-events-none" />
                      )}
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Score */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-extrabold font-mono">ĐIỂM SỐ</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-extrabold tracking-wide font-mono text-lg md:text-xl">
                {score} PTS
              </span>
            </div>
          </header>

          {/* ─── MAIN CONTENT WINDOW (RPG HUD VIEWPORT) ─── */}
          <main className="flex-1 min-h-0 w-full max-w-[98%] mx-auto flex flex-col items-center justify-start relative z-10 py-2 game-main-content">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-stretch game-grid-layout">
              {/* ─── LEFT COLUMN: BATTLE ARENA, HP STATS & ITEM HOTBAR ─── */}
              <div className="lg:col-span-5 flex flex-col gap-4 w-full">
                <BossHud
                  status={bossStatus}
                  playerStatus={bossStatus === "attack" ? "damage" : bossStatus === "damage" ? "attack" : "idle"}
                  hp={bossHp}
                  maxHp={bossMaxHp}
                  name={getBossName(stage)}
                  level={stage === 1 ? 5 : stage === 2 ? 12 : 25}
                  monsterType={stage === 1 ? "slime" : stage === 2 ? "golem" : "eye"}
                  playerHp={hp}
                  playerMaxHp={5}
                  playerLvl={stage}
                  timerMax={timerMax}
                  timerFrozen={timerFrozen}
                  isAnswered={isAnswered}
                  questionId={currentQuestion?.id || ""}
                  timeLeftRef={timeLeftRef}
                  onTimeOut={handleTimeOut}
                />

                <ItemHotbar
                  gold={gold}
                  onUseItem={handleUseItem}
                  disabled={showBossWarning || isAnswered || gameResult !== "playing"}
                  maxShieldLimitReached={gamification ? (gamification.shield_used_in_tier[String(stage)] || false) : false}
                  isBossMode={isBossMode}
                />
              </div>

              {/* ─── RIGHT COLUMN: TIMER, QUESTIONS & ITEMS ─── */}
              <div
                ref={rightColRef}
                className="lg:col-span-7 w-full relative lg:h-full overflow-hidden game-right-column"
              >
                {questions[currentIdx] && (
                  <div className="lg:absolute lg:inset-0 lg:flex lg:flex-col lg:pr-2 custom-scrollbar overflow-y-hidden">
                    <GameQuestionCard
                      currentQuestion={questions[currentIdx]}
                      currentIdx={currentIdx}
                      totalQuestions={questions.length}
                      stage={stage}
                      doubleActive={doubleActive}
                      selectedOptionId={selectedOptionId}
                      isAnswered={isAnswered}
                      isSelectedCorrect={isSelectedCorrect}
                      hiddenOptions={hiddenOptions}
                      onSubmitAnswer={submitAnswer}
                      onNextQuestion={nextQuestion}
                      correctOptionId={correctOptionId}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        <GameResult
          lessonSlug={lessonSlug}
          gameResult={gameResult === "victory" ? "victory" : "defeat"}
          score={gamification?.final_score ?? score}
          gold={gold}
          highestIdx={currentIdx + 1}
          onRetry={handleRetry}
        />
      )}

      {/* ─── SCREEN WARNING POPUP ALERTS ─── */}
      <AnimatePresence>
        {showBossWarning && (
          <motion.div
            className="absolute inset-0 bg-red-955/80 flex flex-col items-center justify-center text-center z-50 pointer-events-none select-none border-4 border-red-650/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1, 0.9, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                setShowBossWarning(false);
              }, 1200);
            }}
          >
            <motion.div
              className="text-red-500 font-extrabold text-5xl md:text-7xl font-mono tracking-widest animate-pulse"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              WARNING!
            </motion.div>
            <div className="text-zinc-100 font-extrabold mt-4 font-mono text-sm md:text-base max-w-sm px-4">
              BOSS {getBossName(stage)} XUẤT HIỆN. HP TRỪ GẤP ĐÔI NẾU TRẢ LỜI SAI!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
