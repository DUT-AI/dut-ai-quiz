"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PhaserArenaProps } from "./types";
import { BattleArenaScene } from "./scenes/battle-arena-scene";
import { PhaserHudOverlay } from "./phaser-hud-overlay";

export default function PhaserArena({
  stage,
  playerHp,
  playerMaxHp,
  bossHp,
  bossMaxHp,
  bossName,
  bridge,
  isMuted = false,
  className = "",
  onReady,
  children,
}: PhaserArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Store initial values in refs so Phaser is initialized once without restarting on prop updates
  const stageRef = useRef(stage);
  const playerHpRef = useRef(playerHp);
  const playerMaxHpRef = useRef(playerMaxHp);
  const bossHpRef = useRef(bossHp);
  const bossMaxHpRef = useRef(bossMaxHp);
  const bossNameRef = useRef(bossName);
  const isMutedRef = useRef(isMuted);

  stageRef.current = stage;
  playerHpRef.current = playerHp;
  playerMaxHpRef.current = playerMaxHp;
  bossHpRef.current = bossHp;
  bossMaxHpRef.current = bossMaxHp;
  bossNameRef.current = bossName;
  isMutedRef.current = isMuted;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current || gameRef.current) return;

    let phaserInstance: Phaser.Game | null = null;

    // Dynamically load Phaser module to safeguard against SSR
    import("phaser").then((PhaserModule) => {
      if (!containerRef.current || gameRef.current) return;

      const Phaser = PhaserModule.default || PhaserModule;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 800,
        height: 420,
        transparent: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [BattleArenaScene],
      };

      phaserInstance = new Phaser.Game(config);
      gameRef.current = phaserInstance;

      // Start main scene with initial data
      phaserInstance.scene.start("BattleArenaScene", {
        bridge,
        stage: stageRef.current,
        playerHp: playerHpRef.current,
        playerMaxHp: playerMaxHpRef.current,
        bossHp: bossHpRef.current,
        bossMaxHp: bossMaxHpRef.current,
        bossName: bossNameRef.current,
        isMuted: isMutedRef.current,
      });

      if (onReady) onReady();
    }).catch((err) => {
      console.error("[PhaserArena] Failed to initialize Phaser:", err);
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      } else if (phaserInstance) {
        (phaserInstance as Phaser.Game).destroy(true);
      }
    };
  }, [isMounted, bridge]);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 backdrop-blur-md ${className}`}>
      {/* Phaser Canvas Mount Point */}
      <div
        ref={containerRef}
        className="w-full aspect-[16/9] max-h-[440px] flex items-center justify-center pointer-events-auto"
      />

      {/* ❤️ V1-STYLE HEART HUD OVERLAY (Player & Boss Hearts) */}
      <PhaserHudOverlay
        stage={stage}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        bossHp={bossHp}
        bossMaxHp={bossMaxHp}
        bossName={bossName}
      />

      {/* ⏳ STOPWATCH CIRCULAR TIMER */}
      {children && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          {children}
        </div>
      )}

      {/* Loading overlay if canvas not ready */}
      {!isMounted && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-indigo-400 animate-pulse bg-zinc-950/80">
          ĐANG KHỞI TẠO ĐẤU TRƯỜNG PHASER 4...
        </div>
      )}
    </div>
  );
}
