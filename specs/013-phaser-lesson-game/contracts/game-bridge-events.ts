/**
 * Type contracts for the event communication bridge between React and Phaser.
 */

export interface PlayerStats {
  hp: number;
  maxHp: number;
  level: number;
  name: string;
}

export interface BossStats {
  hp: number;
  maxHp: number;
  level: number;
  name: string;
  monsterType: "slime" | "golem" | "eye" | "reaper";
}

export interface TurnOutcomeEvent {
  outcome: "correct" | "incorrect" | "timeout";
  playerDamage: number;
  bossDamage: number;
  newPlayerHp: number;
  newBossHp: number;
  activeBuffs?: {
    shield?: boolean;
    double?: boolean;
  };
  customDialogue?: string;
}

export interface ItemUseEvent {
  itemId: string;
  effectType: "shield" | "freeze" | "double" | "hint";
}

export interface StageInitEvent {
  stage: number;
  player: PlayerStats;
  boss: BossStats;
}

export interface BridgeEvents {
  // Events sent from React to Phaser
  "react:init_arena": StageInitEvent;
  "react:turn_outcome": TurnOutcomeEvent;
  "react:item_used": ItemUseEvent;
  "react:game_result": { result: "victory" | "defeat" };
  "react:set_audio_muted": { muted: boolean };
  "react:set_audio_volume": { volume: number };
  "react:reset": void;

  // Events sent from Phaser to React
  "phaser:ready": void;
  "phaser:turn_anim_complete": { outcome: "correct" | "incorrect" | "timeout" };
  "phaser:audio_state_change": { muted: boolean; volume: number; currentTrack: string | null };
  "phaser:error": { message: string };
}

export type EventKey = keyof BridgeEvents;
export type EventPayload<K extends EventKey> = BridgeEvents[K];

export interface IPhaserBridge {
  emit<K extends EventKey>(event: K, payload: EventPayload<K>): void;
  on<K extends EventKey>(event: K, handler: (payload: EventPayload<K>) => void): () => void;
  destroy(): void;
}
