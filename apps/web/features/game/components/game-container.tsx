"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";

import BossHud from "./boss-hud";
import ItemHotbar from "./item-hotbar";
import GameQuestionCard from "./game-question-card";
import GameResult from "./game-result";
import GameTopBar from "./game-top-bar";
import GameHeaderHud from "./game-header-hud";
import GameAlertOverlay from "./game-alert-overlay";
import GameAntiCheatModal from "./game-anti-cheat-modal";

import { useThemeStore } from "@/store/theme-store";
import { useAntiCheat } from "@/hooks/use-anti-cheat";
import { useGameSession, useGameTimer, useGameItems, useGameTurn } from "../hooks";
import { getBossName } from "../types";

interface GameContainerProps {
  lessonSlug: string;
  initialSession: any;
}

export default function GameContainer({ lessonSlug, initialSession }: GameContainerProps) {
  const { darkMode } = useThemeStore();
  const rightColRef = useRef<HTMLDivElement | null>(null);

  const gameBackgroundStyle = useMemo(() => ({
    backgroundImage: darkMode
      ? `radial-gradient(circle, rgba(255,255,255,0.02) 1.5px, transparent 1.5px), linear-gradient(to bottom right, #09090b, #030712)`
      : `radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px), linear-gradient(to bottom right, #f4eedb, #eae2c6)`,
    backgroundSize: "24px 24px, 100% 100%",
    backgroundAttachment: "fixed" as const,
  }), [darkMode]);

  // Decoupled Business Logic Hooks
  const session = useGameSession({ lessonSlug, initialSession });
  const timer = useGameTimer({
    currentQuestion: session.currentQuestion,
    currentIdx: session.currentIdx,
    isAnswered: false,
    onTimeOut: () => {},
  });
  const items = useGameItems({
    sessionId: session.sessionId,
    currentQuestion: session.currentQuestion,
    gold: session.gold,
    stage: session.stage,
    gamification: session.gamification,
    isAnswered: false,
    gameResult: session.gameResult,
    showBossWarning: session.showBossWarning,
    isBossMode: session.isBossMode,
    setGold: session.setGold,
    setGamification: session.setGamification,
    onFreezeTimer: timer.freezeTimerFor30Seconds,
  });
  const turn = useGameTurn({ session, timer, items, lessonSlug });

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

  // Auto-scroll on answering and question transition
  useEffect(() => {
    if (turn.isAnswered) {
      const t = setTimeout(() => {
        if (rightColRef.current && rightColRef.current.scrollHeight > rightColRef.current.clientHeight) {
          rightColRef.current.scrollTo({ top: rightColRef.current.scrollHeight, behavior: "smooth" });
        }
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [turn.isAnswered]);

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
                  isAnswered={turn.isAnswered}
                  questionId={session.currentQuestion?.id || ""}
                  timeLeftRef={timer.timeLeftRef}
                  onTimeOut={turn.handleTimeOut}
                />
                <ItemHotbar
                  gold={session.gold}
                  onUseItem={items.handleUseItem}
                  disabled={session.showBossWarning || turn.isAnswered || session.gameResult !== "playing"}
                  maxShieldLimitReached={session.gamification ? (session.gamification.shield_used_in_tier?.[String(session.stage)] || false) : false}
                  isBossMode={session.isBossMode}
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
                    isAnswered={turn.isAnswered}
                    isSelectedCorrect={turn.isSelectedCorrect}
                    hiddenOptions={items.hiddenOptions}
                    onSubmitAnswer={turn.submitAnswer}
                    onNextQuestion={turn.nextQuestion}
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
          score={session.gamification?.final_score ?? session.score}
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
