import type { ReactNode } from "react";
import type { IPhaserBridge } from "./game-bridge-events";

export interface PhaserArenaProps {
  stage: number;
  playerHp: number;
  playerMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  monsterType: "slime" | "golem" | "eye" | "reaper";
  bridge: IPhaserBridge;
  className?: string;
  onReady?: () => void;
}

export interface PhaserSceneConfig {
  width: number;
  height: number;
  transparent: boolean;
  parent: string | HTMLElement;
  scene: any[];
}
