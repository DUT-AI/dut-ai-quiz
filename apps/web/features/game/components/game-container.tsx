"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

import { useGameSession, useGameTimer, useGameItems, useGameTurn } from "../hooks";
import { useAntiCheat } from "@/hooks/use-anti-cheat";
import { type GameSession, getBossName } from "../types";

import GameTopBar from "./game-top-bar";
import GameHeaderHud from "./game-header-hud";
import BossHud from "./boss-hud";
import ItemHotbar from "./item-hotbar";
import GameQuestionCard from "./game-question-card";
import GameResult from "./game-result";
import GameAlertOverlay from "./game-alert-overlay";
import GameAntiCheatModal from "./game-anti-cheat-modal";

interface GameContainerProps {
  lessonSlug: string;
  initialSession?: GameSession | null;
  darkMode?: boolean;
}

export default function GameContainer({
  lessonSlug,
  initialSession = null,
  darkMode = false,
}: GameContainerProps) {
  const rightColRef = useRef<HTMLDivElement>(null);

  // Background visual style
  const gameBackgroundStyle = useMemo(() => ({
    backgroundImage: darkMode
      ? `radial-gradient(circle, rgba(255,255,255,0.02) 1.5px, transparent 1.5px), linear-gradient(to bottom right, #09090b, #030712)`
      : `radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px), linear-gradient(to bottom right, #f4eedb, #eae2c6)`,
    backgroundSize: "24px 24px, 100% 100%",
    backgroundAttachment: "fixed" as const,
  }), [darkMode]);

  // 1. Session state
  const session = useGameSession({ lessonSlug, initialSession });

  // 2. Turn State Machine hook (Độc lập, không phụ thuộc timer/items lúc khởi tạo)
  const turn = useGameTurn({ session, lessonSlug });

  // Trạng thái cho phép tương tác (chỉ khi đang ở câu hỏi tích cực)
  const isQuestionActive = turn.status === "QUESTION_ACTIVE";
  const isTurnDone = turn.status === "TURN_RESULT" || turn.status === "GAME_OVER";

  // 3. Timer hook
  const timer = useGameTimer({
    currentQuestion: session.currentQuestion,
    currentIdx: session.currentIdx,
  });

  // 4. Items hook
  const items = useGameItems({
    sessionId: session.sessionId,
    currentQuestion: session.currentQuestion,
    gold: session.gold,
    stage: session.stage,
    gamification: session.gamification,
    canInteract: isQuestionActive,
    gameResult: session.gameResult,
    showBossWarning: session.showBossWarning,
    isBossMode: session.isBossMode,
    setGamification: session.setGamification,
    onFreezeTimer: timer.freezeTimerFor30Seconds,
  });

  // Handler submit từ UI (User click option)
  const handleSubmitOption = useCallback((optionId: string) => {
    const timeResponse = timer.timerMax - timer.timeLeftRef.current;
    turn.submitAnswer({
      optionId,
      timeResponse,
      activeBuffs: items.activeBuffs,
      onResetBuffs: items.resetItemBuffs,
    });
  }, [timer.timerMax, timer.timeLeftRef, turn, items.activeBuffs, items.resetItemBuffs]);

  // Handler khi hết giờ (Timer Timeout)
  const handleTimeOut = useCallback(() => {
    if (!isQuestionActive) return;
    toast.error("Hết thời gian suy nghĩ mất rồi!");
    const timeResponse = timer.timerMax;
    turn.submitAnswer({
      optionId: "",
      timeResponse,
      activeBuffs: items.activeBuffs,
      onResetBuffs: items.resetItemBuffs,
    });
  }, [isQuestionActive, timer.timerMax, turn, items.activeBuffs, items.resetItemBuffs]);

  // Handler chuyển sang câu tiếp theo
  const handleNextQuestion = useCallback(() => {
    turn.nextQuestion(() => {
      items.resetItemBuffs();
      timer.setTimerFrozen(false);
    });
  }, [turn, items, timer]);

  // Anti-Cheat system
  const antiCheat = useAntiCheat({
    isActive: session.screen === "playing" && session.sessionId !== "",
    isSubmitting: session.screen === "result" || session.gameResult !== "playing",
    onAutoSubmitted: () => {
      toast.error("Bạn đã vi phạm quy chế thi đấu quá 3 lần! Trận đấu kết thúc.");
      session.setGameResult("defeat");
      session.setScreen("result");
    },
  });

  // Auto-scroll on turn result and question transition
  useEffect(() => {
    if (isTurnDone) {
      const t = setTimeout(() => {
        if (rightColRef.current && rightColRef.current.scrollHeight > rightColRef.current.clientHeight) {
          rightColRef.current.scrollTo({ top: rightColRef.current.scrollHeight, behavior: "smooth" });
        }
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isTurnDone]);

  useEffect(() => {
    if (rightColRef.current) rightColRef.current.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [session.currentIdx]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error("Exit fullscreen error:", err));
    }
  }, []);

  if (session.isInitializing) {
    return (
      <div className="min-h-screen text-zinc-955 dark:text-zinc-100 flex flex-col items-center justify-center font-sans p-4" style={gameBackgroundStyle}>
        <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-extrabold text-lg text-zinc-700 dark:text-zinc-400 font-mono animate-pulse">ĐANG KHỞI TẠO ĐẤU TRƯỜNG...</p>
      </div>
    );
  }

  return (
    <div className={`text-zinc-955 dark:text-zinc-100 flex flex-col font-sans select-none p-2 md:p-4 px-1.5 md:px-2 min-h-screen overflow-y-auto custom-scrollbar game-layout-container ${turn.screenShake ? "animate-[shake_0.5s_infinite]" : ""}`} style={gameBackgroundStyle}>
      <GameTopBar lessonSlug={lessonSlug} />

      {session.screen === "start" ? (
        <div className="flex-1 flex items-center justify-center font-mono text-zinc-500"><p className="animate-pulse">ĐANG KHỞI TẠO ĐẤU TRƯỜNG...</p></div>
      ) : session.screen === "playing" ? (
        <>
          <GameHeaderHud stageProgress={session.stageProgress} currentIdx={session.currentIdx} score={session.score} />
          <main className="flex-1 w-full max-w-[98%] mx-auto flex flex-col items-center justify-start relative z-10 py-1 md:py-2">
            <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-stretch">
              <div className="lg:col-span-5 flex flex-col gap-4 w-full">
                <BossHud
                  status={turn.bossStatus}
                  playerStatus={turn.bossStatus === "attack" ? "damage" : turn.bossStatus === "damage" ? "attack" : "idle"}
                  hp={session.bossHp}
                  maxHp={session.bossMaxHp}
                  name={getBossName(session.stage)}
                  level={session.stage === 1 ? 5 : session.stage === 2 ? 12 : 25}
                  monsterType={session.stage === 1 ? "slime" : session.stage === 2 ? "golem" : "eye"}
                  playerHp={session.hp}
                  playerMaxHp={5}
                  playerLvl={session.stage}
                  timerMax={timer.timerMax}
                  timerFrozen={timer.timerFrozen}
                  isTimerActive={isQuestionActive}
                  questionId={session.currentQuestion?.id || ""}
                  timeLeftRef={timer.timeLeftRef}
                  onTimeOut={handleTimeOut}
                />
                <ItemHotbar
                  gold={session.gold}
                  onUseItem={items.handleUseItem}
                  disabled={session.showBossWarning || !isQuestionActive || session.gameResult !== "playing"}
                  maxShieldLimitReached={session.gamification ? (session.gamification.shield_used_in_tier?.[String(session.stage)] || false) : false}
                  isBossMode={session.isBossMode}
                  activeBuffs={items.activeBuffs}
                />
              </div>

              <div ref={rightColRef} className="lg:col-span-7 w-full flex flex-col min-h-0">
                {session.currentQuestion && (
                  <GameQuestionCard
                    currentQuestion={session.currentQuestion}
                    currentIdx={session.currentIdx}
                    totalQuestions={session.questions.length}
                    stage={session.stage}
                    doubleActive={items.doubleActive}
                    selectedOptionId={turn.selectedOptionId}
                    status={turn.status}
                    isSelectedCorrect={turn.isSelectedCorrect}
                    hiddenOptions={items.hiddenOptions}
                    onSubmitAnswer={handleSubmitOption}
                    onNextQuestion={handleNextQuestion}
                    correctOptionId={turn.correctOptionId}
                  />
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        <GameResult
          lessonSlug={lessonSlug}
          gameResult={session.gameResult === "victory" ? "victory" : "defeat"}
          score={session.score}
          gold={session.gold}
          highestIdx={session.currentIdx + 1}
          onRetry={session.handleRetry}
        />
      )}

      <GameAlertOverlay showBossWarning={session.showBossWarning} stage={session.stage} onAnimationComplete={() => session.setShowBossWarning(false)} />

      {session.screen === "playing" && session.gameResult === "playing" && (
        <GameAntiCheatModal
          isFullScreen={antiCheat.isFullScreen}
          showViolationModal={antiCheat.showViolationModal}
          violationType={antiCheat.violationType}
          violationCount={antiCheat.violationCount}
          enterFullScreen={antiCheat.enterFullScreen}
          dismissViolation={antiCheat.dismissViolation}
        />
      )}
    </div>
  );
}
