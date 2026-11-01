"use client";

import { useEffect, useRef } from "react";
import { PhaserGameBridge } from "../components/phaser/phaser-game-bridge";
import type { UseGameSessionReturn } from "./use-game-session";
import type { BossStatus } from "../types";
import { getBossName } from "../types";

interface UsePhaserBridgeProps {
  session: UseGameSessionReturn;
  turnStatus: string;
  isSelectedCorrect: boolean;
  bossStatus: BossStatus;
  isMuted?: boolean;
}

export function usePhaserBridge({
  session,
  turnStatus,
  isSelectedCorrect,
  bossStatus,
  isMuted = false,
}: UsePhaserBridgeProps) {
  const bridgeRef = useRef<PhaserGameBridge | null>(null);
  const prevTurnStatusRef = useRef<string>(turnStatus);
  const prevStageRef = useRef<number | null>(null);
  const prevBossStatusRef = useRef<BossStatus>("idle");

  if (!bridgeRef.current) {
    bridgeRef.current = new PhaserGameBridge();
  }

  const bridge = bridgeRef.current;

  // 1. Sync Audio Mute
  useEffect(() => {
    bridge.emit("react:set_audio_muted", { muted: isMuted });
  }, [bridge, isMuted]);

  // 2. Sync Stage Change ONLY when round/stage actually changes
  useEffect(() => {
    if (session.stage > 0 && session.stage !== prevStageRef.current) {
      prevStageRef.current = session.stage;
      bridge.emit("react:stage_change", {
        stage: session.stage,
        bossName: getBossName(session.stage),
        monsterType: session.stage === 1 ? "slime" : session.stage === 2 ? "golem" : "reaper",
      });
    }
  }, [bridge, session.stage]);

  // 3. Sync HP updates smoothly without touching audio or stage state
  useEffect(() => {
    bridge.emit("react:stat_update", {
      playerHp: session.hp,
      playerMaxHp: 5,
      bossHp: session.bossHp,
      bossMaxHp: session.bossMaxHp,
    });
  }, [bridge, session.hp, session.bossHp, session.bossMaxHp]);

  // 4. Combat attack triggers mapped directly from turn.bossStatus
  useEffect(() => {
    if (prevBossStatusRef.current !== bossStatus) {
      if (bossStatus === "attack") {
        // Boss attacks player!
        bridge.emit("react:boss_attack", {
          damage: 1,
          dialogue: "Trúng chiêu đi!",
        });
      } else if (bossStatus === "damage") {
        // Player attacks boss!
        bridge.emit("react:player_attack", {
          damage: 25,
          dialogue: "Chém nè!",
        });
      } else if (bossStatus === "defeat") {
        bridge.emit("react:boss_defeat", undefined);
      }
      prevBossStatusRef.current = bossStatus;
    }
  }, [bossStatus, bridge]);

  // 5. Fallback Turn Outcome synchronization for game turn completeness
  useEffect(() => {
    const isResult = turnStatus === "TURN_RESULT" || turnStatus === "GAME_OVER";
    const wasResult = prevTurnStatusRef.current === "TURN_RESULT" || prevTurnStatusRef.current === "GAME_OVER";

    if (!wasResult && isResult) {
      bridge.emit("react:turn_outcome", {
        outcome: isSelectedCorrect ? "correct" : "incorrect",
        playerDamage: isSelectedCorrect ? 0 : 1,
        bossDamage: isSelectedCorrect ? 25 : 0,
        newPlayerHp: session.hp,
        newBossHp: session.bossHp,
        customDialogue: isSelectedCorrect ? "Chính xác! Chém nè!" : "Ôi không! Trượt rồi!",
      });
    }
    prevTurnStatusRef.current = turnStatus;
  }, [turnStatus, isSelectedCorrect, bridge, session.hp, session.bossHp]);

  // 6. Sync Game Result (Victory / Defeat)
  useEffect(() => {
    if (session.gameResult === "victory" || session.gameResult === "defeat") {
      bridge.emit("react:game_result", { result: session.gameResult });
    }
  }, [bridge, session.gameResult]);

  useEffect(() => {
    return () => {
      bridge.destroy();
    };
  }, [bridge]);

  return bridge;
}
