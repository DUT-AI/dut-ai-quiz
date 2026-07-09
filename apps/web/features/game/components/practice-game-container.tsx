"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Swords, Skull, Trophy, Lock, Heart, Shield, Zap, BookOpen } from "lucide-react";
import { toast } from "sonner";

import BossHud from "./boss-hud";
import ItemHotbar, { ItemType } from "./item-hotbar";
import PracticeStartScreen from "./practice-start-screen";
import PracticeQuestionCard from "./practice-question-card";
import PracticeGameResult from "./practice-game-result";

import {
  useActiveGameSession,
  useStartGameSession,
  usePatchGameAnswer,
  useUseGameItem,
  useFinishGameSession,
} from "../queries";
import { type GameQuestion, type GamificationState } from "../types";

const getBossName = (stageNum: number) => {
  if (stageNum === 1) return "SLIME CHÚA";
  if (stageNum === 2) return "MA BÀN THẠCH";
  return "MA NHÃN TỐI THƯỢNG";
};

interface PracticeGameContainerProps {
  lessonSlug: string;
}

export default function PracticeGameContainer({ lessonSlug }: PracticeGameContainerProps) {
  const router = useRouter();

  // 1. Fetch active session on load
  const {
    data: activeSession,
    isLoading: isLoadingActiveSession,
    error: activeSessionError,
    refetch: refetchActiveSession,
  } = useActiveGameSession(lessonSlug);

  // Mutations
  const startSessionMutation = useStartGameSession();
  const patchAnswerMutation = usePatchGameAnswer();
  const useItemMutation = useUseGameItem();
  const finishSessionMutation = useFinishGameSession();

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
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerFrozen, setTimerFrozen] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timeLeft when current question changes
  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.time_limit);
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

  // Visual effects
  const [screenShake, setScreenShake] = useState(false);
  const [gameResult, setGameResult] = useState<"playing" | "victory" | "defeat">("playing");
  const [stageProgress, setStageProgress] = useState<("correct" | "incorrect" | "idle")[]>([]);

  // 2. Handle active session lookup
  const hasActiveSession = !!activeSession?.session_id;

  // Initialize game state from session data
  const initializeGame = (sessionData: { session_id: string; snapshot: any }) => {
    const snap = sessionData.snapshot;
    setSessionId(sessionData.session_id);
    setQuestions(snap.questions);
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

    const idx = snap.gamification.last_question_index;
    setCurrentIdx(idx);

    if (idx === 0) {
      setCountdown(3);
    } else {
      setCountdown(null);
    }
    setHp(snap.gamification.lives);
    setGold(snap.gamification.gold);
    setScore(snap.gamification.points);

    // Reconstruct progress dots based on answers
    const totalQCount = snap.questions.length;
    const progress: ("correct" | "incorrect" | "idle")[] = Array.from({ length: totalQCount }).map(() => "idle");
    
    // Server snapshot.answers contains: { [question_id]: option_id }
    // But does not tell us correct/incorrect directly, except if we deduce it or we just look up matching.
    // Wait, the client answers dict doesn't need to reconstruct past correct/incorrect perfectly,
    // but we can assume completed questions before `last_question_index` were answered.
    // To keep it simple, past answered questions can just show completed green/red. 
    // Since we don't have is_correct for past questions in snapshot, we can show "correct" for simplicity,
    // or keep it blank. Let's just mark past ones as "correct" or "incorrect" if we can, or just keep them green.
    // Actually, in the database session, since we only resume in-progress, we can mark all past questions as "correct"
    // to keep the visual indicator clean, or track them. Let's just set the past dots as "correct" for now.
    for (let i = 0; i < idx; i++) {
      progress[i] = "correct"; 
    }
    setStageProgress(progress);

    // Check if the current question is a boss fight
    const currentQ = snap.questions[idx];
    if (currentQ) {
      const bossMode = currentQ.is_boss;
      setIsBossMode(bossMode);
      setBossHp(snap.gamification.boss_hp === 1 ? 5 : 0);
      setBossMaxHp(5);
    }

    setGameResult("playing");
    setScreen("playing");
  };

  // Synchronize state when activeSession query changes (e.g., on browser back navigation)
  useEffect(() => {
    // Only synchronize when the local sessionId is empty (i.e. on mount / back navigation)
    if (!isLoadingActiveSession && sessionId === "") {
      if (!activeSession?.session_id) {
        // If there's no active session on the server but we are stuck in playing state,
        // reset to the start screen.
        if (screen === "playing") {
          setScreen("start");
          setQuestions([]);
          setGamification(null);
          setGameResult("playing");
        }
      } else {
        // If the server has an active session and we are stuck in playing state,
        // but our local sessionId is not set yet (e.g. on mount / back navigation),
        // initialize the game state.
        if (screen === "playing") {
          initializeGame(activeSession);
        }
      }
    }
  }, [activeSession, isLoadingActiveSession, screen, sessionId]);

  // Start game challenge
  const handleStartGame = () => {
    if (hasActiveSession && activeSession) {
      initializeGame(activeSession);
      toast.success("Đã khôi phục phiên thi đấu trước đó!");
    } else {
      startSessionMutation.mutate(
        { lesson_slug: lessonSlug },
        {
          onSuccess: (data) => {
            initializeGame(data);
            toast.success("Trận đấu mới đã bắt đầu!");
          },
          onError: (err: any) => {
            toast.error(err.message || "Không thể khởi tạo đấu trường!");
          },
        }
      );
    }
  };

  // Timer management
  useEffect(() => {
    if (screen !== "playing" || gameResult !== "playing" || showBossWarning || isAnswered || countdown !== null) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      if (timerFrozen) return;

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, timerFrozen, showBossWarning, isAnswered, gameResult, screen, countdown]);

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
    const timeResponse = timerMax - timeLeft;

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

    // Check if we evolved stage
    const nextQ = questions[nextIdx];
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
    // Finish active session if any
    if (sessionId) {
      finishSessionMutation.mutate(sessionId, {
        onSuccess: () => {
          // Invalidate active session and refetch
          refetchActiveSession().then(() => {
            // Trigger start
            startSessionMutation.mutate(
              { lesson_slug: lessonSlug },
              {
                onSuccess: (data) => {
                  initializeGame(data);
                  toast.success("Trận đấu mới đã bắt đầu!");
                },
              }
            );
          });
        },
        onError: () => {
          // If finish fails, just force start
          startSessionMutation.mutate(
            { lesson_slug: lessonSlug },
            {
              onSuccess: (data) => {
                initializeGame(data);
              },
            }
          );
        },
      });
    }
  };

  if (isLoadingActiveSession) {
    return (
      <div
        className="min-h-screen text-zinc-950 dark:text-slate-100 flex flex-col items-center justify-center font-sans relative select-none p-4 md:p-6"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px),
            linear-gradient(to bottom right, #f4eedb, #eae2c6)
          `,
          backgroundSize: "24px 24px, 100% 100%",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Style tag to support dark mode background override */}
        <style jsx global>{`
          .dark-bg-override {
            background-image: radial-gradient(circle, rgba(255,255,255,0.02) 1.5px, transparent 1.5px),
              linear-gradient(to bottom right, #09090b, #030712) !important;
          }
        `}</style>
        <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-extrabold text-lg text-zinc-700 dark:text-slate-350 font-mono animate-pulse">
          ĐANG KHỞI TẠO ĐẤU TRƯỜNG...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen text-zinc-950 dark:text-slate-100 flex flex-col font-sans relative select-none p-4 md:p-6 transition-all duration-300 ${
        screenShake ? "animate-[shake_0.5s_infinite]" : ""
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px),
          linear-gradient(to bottom right, #f4eedb, #eae2c6)
        `,
        backgroundSize: "24px 24px, 100% 100%",
        backgroundAttachment: "fixed",
      }}
      ref={(el) => {
        if (el) {
          // Check if dark mode is active to override background inline style
          const isDark = document.documentElement.classList.contains("dark");
          if (isDark) {
            el.style.backgroundImage = `
              radial-gradient(circle, rgba(255,255,255,0.02) 1.5px, transparent 1.5px),
              linear-gradient(to bottom right, #09090b, #030712)
            `;
          } else {
            el.style.backgroundImage = `
              radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px),
              linear-gradient(to bottom right, #f4eedb, #eae2c6)
            `;
          }
        }
      }}
    >
      <style jsx global>{`
        html, body {
          height: auto !important;
          overflow: auto !important;
          overflow-y: auto !important;
        }
        #__next, main, [data-nextjs-scroll-focus-boundary], #root, .dark, body > div {
          height: auto !important;
          overflow: visible !important;
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
      `}</style>

      {screen === "start" ? (
        <PracticeStartScreen
          lessonSlug={lessonSlug}
          hasActiveSession={hasActiveSession}
          isStarting={startSessionMutation.isPending}
          onStart={handleStartGame}
        />
      ) : screen === "playing" ? (
        <>
          {/* ─── HEADER HUD (RPG STATUS BAR) ─── */}
          <header className="relative w-full max-w-7xl mx-auto flex justify-between items-center bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-3 md:p-4 rounded-none mb-3 z-10 shadow-md">
            {/* Left Side: Stage progress dot */}
            <div className="flex flex-col items-start select-none">
              <div className="text-[10px] md:text-xs text-zinc-500 dark:text-slate-400 mb-1 tracking-wider font-extrabold font-mono">
                TIẾN TRÌNH THỬ THÁCH
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-md md:max-w-none py-1">
                {stageProgress.map((status, i) => {
                  const isActive = i === currentIdx;
                  let icon = null;
                  let btnClass = "bg-zinc-100 dark:bg-slate-950 border-zinc-300 dark:border-slate-800 text-zinc-400 dark:text-slate-600 cursor-not-allowed";

                  if (isActive) {
                    icon = <Swords className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-zinc-900 dark:text-white animate-pulse" />;
                    btnClass = "bg-amber-400 dark:bg-amber-500 border-zinc-900 dark:border-slate-700 text-zinc-900 dark:text-white scale-110";
                  } else if (status === "correct") {
                    icon = <Trophy className="w-3 h-3 md:w-4 md:h-4 text-emerald-800 dark:text-emerald-300" />;
                    btnClass = "bg-emerald-400 dark:bg-emerald-600 border-zinc-900 dark:border-slate-700";
                  } else if (status === "incorrect") {
                    icon = <Skull className="w-3 h-3 md:w-4 md:h-4 text-red-800 dark:text-red-300" />;
                    btnClass = "bg-red-400 dark:bg-red-600 border-zinc-900 dark:border-slate-700";
                  } else {
                    icon = <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-400 dark:text-slate-600" />;
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled
                      className={`relative w-8 h-8 md:w-10 md:h-10 border-2 transition-all duration-300 flex items-center justify-center rounded-none font-bold ${btnClass}`}
                    >
                      {isActive && (
                        <span className="absolute inset-0 rounded-none border-2 border-amber-500 dark:border-amber-400 animate-ping opacity-60 pointer-events-none" />
                      )}
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Score */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] md:text-xs text-zinc-500 dark:text-slate-400 font-extrabold font-mono">ĐIỂM SỐ</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-extrabold tracking-wide font-mono text-lg md:text-xl">
                {score} PTS
              </span>
            </div>
          </header>

          {/* ─── MAIN CONTENT WINDOW (RPG HUD VIEWPORT) ─── */}
          <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-start relative z-10 py-2">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
              <div className="lg:col-span-7 flex flex-col gap-4 w-full items-center">
                {questions[currentIdx] && (
                  <PracticeQuestionCard
                    currentQuestion={questions[currentIdx]}
                    currentIdx={currentIdx}
                    totalQuestions={questions.length}
                    stage={stage}
                    doubleActive={doubleActive}
                    timeLeft={timeLeft}
                    timerMax={timerMax}
                    timerFrozen={timerFrozen}
                    selectedOptionId={selectedOptionId}
                    isAnswered={isAnswered}
                    isSelectedCorrect={isSelectedCorrect}
                    hiddenOptions={hiddenOptions}
                    onSubmitAnswer={submitAnswer}
                    onNextQuestion={nextQuestion}
                    correctOptionId={correctOptionId}
                  />
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        <PracticeGameResult
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
            className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center text-center z-50 pointer-events-none select-none border-4 border-red-600/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1, 0.9, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                setShowBossWarning(false);
              }, 2000);
            }}
          >
            <div className="absolute inset-0 bg-red-600/5 animate-[pulse_0.4s_infinite]" />
            <motion.div
              initial={{ scale: 0.8, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="px-8 py-6 bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 shadow-lg rounded-none max-w-md relative z-10 text-zinc-955 dark:text-slate-100 font-mono"
            >
              <Skull className="w-16 h-16 text-red-500 mx-auto mb-4 animate-[bounce_0.6s_infinite]" />
              <h1 className="text-2xl md:text-3xl font-black tracking-widest text-red-600 dark:text-red-400 mb-2">
                CẢNH BÁO: ĐẤU BOSS!
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400 tracking-wider border-t-2 border-zinc-150 dark:border-slate-800 pt-2.5 font-bold">
                GIÁ VẬT PHẨM X2 | ĐIỂM SỐ X2 | THỜI GIAN SUY NGHĨ 10 GIÂY
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 3-SECOND COUNTDOWN OVERLAY ─── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 bg-zinc-950 dark:bg-slate-950 flex flex-col items-center justify-center z-50 select-none pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.2, 1], opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-7xl md:text-8xl lg:text-9xl font-black font-mono text-amber-400 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] select-none text-center"
            >
              {countdown === 0 ? "BẮT ĐẦU!" : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
