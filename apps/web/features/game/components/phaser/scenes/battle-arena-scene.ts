import Phaser from "phaser";
import { AnimationSystem } from "../systems/animation-system";
import { ParticleSystem } from "../systems/particle-system";
import { ParallaxSystem } from "../systems/parallax-system";
import { AudioSystem } from "../systems/audio-system";
import { CharacterEntity } from "../entities/character-entity";
import { DialogueBubble } from "../entities/dialogue-bubble";
import type { IPhaserBridge, ItemUseEvent, StageInitEvent, TurnOutcomeEvent } from "../types";

export interface BattleArenaSceneData {
  bridge: IPhaserBridge;
  stage: number;
  playerHp: number;
  playerMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  isMuted?: boolean;
}

export class BattleArenaScene extends Phaser.Scene {
  private bridge!: IPhaserBridge;
  private animationSystem!: AnimationSystem;
  private particleSystem!: ParticleSystem;
  private parallaxSystem!: ParallaxSystem;
  private audioSystem!: AudioSystem;

  public player!: CharacterEntity;
  public boss!: CharacterEntity;
  private playerDialogue!: DialogueBubble;
  private bossDialogue!: DialogueBubble;

  private stage: number = 1;
  private playerHp: number = 5;
  private playerMaxHp: number = 5;
  private bossHp: number = 100;
  private bossMaxHp: number = 100;
  private bossName: string = "Hư Vô Thần Sứ";
  private isMuted: boolean = false;

  // In-engine health bar graphic objects
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "BattleArenaScene" });
  }

  init(data: BattleArenaSceneData): void {
    this.bridge = data.bridge;
    this.stage = data.stage || 1;
    this.playerHp = data.playerHp || 5;
    this.playerMaxHp = data.playerMaxHp || 5;
    this.bossHp = data.bossHp || 100;
    this.bossMaxHp = data.bossMaxHp || 100;
    this.bossName = data.bossName || "Hư Vô Thần Sứ";
    this.isMuted = data.isMuted || false;

    this.animationSystem = new AnimationSystem(this);
    this.particleSystem = new ParticleSystem(this);
    this.parallaxSystem = new ParallaxSystem(this);
    this.audioSystem = new AudioSystem(this);
  }

  preload(): void {
    this.animationSystem.preload();
    this.parallaxSystem.preload();
    this.audioSystem.preload();
  }

  create(): void {
    // 1. Build Animations & Systems
    this.animationSystem.create();
    this.particleSystem.create();
    this.parallaxSystem.create(this.stage);
    this.audioSystem.create(this.isMuted);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const groundY = height - 85;

    // 2. Spawn Player (Shield Knight)
    const playerX = Math.min(180, width * 0.25);
    this.player = new CharacterEntity({
      scene: this,
      x: playerX,
      y: groundY,
      role: "player",
      name: "Hiệp Sĩ",
      initialHp: this.playerHp,
      maxHp: this.playerMaxHp,
      idleAnimKey: "knight_idle",
      walkAnimKey: "knight_walk",
      attackAnimKey: "knight_attack",
    });
    this.playerDialogue = new DialogueBubble(this, this.player.container, "Hiệp Sĩ", "player");

    // 4. Spawn Boss depending on stage (Stage 1: Slime, Stage 2: Golem, Stage 3: Reaper)
    const bossX = Math.max(width - 180, width * 0.75);
    const bossConfig = this.getBossConfigForStage(this.stage, this.bossName);
    this.boss = new CharacterEntity({
      scene: this,
      x: bossX,
      y: groundY,
      role: "boss",
      name: this.bossName,
      initialHp: this.bossHp,
      maxHp: this.bossMaxHp,
      idleAnimKey: bossConfig.idleAnimKey,
      walkAnimKey: bossConfig.walkAnimKey,
      attackAnimKey: bossConfig.attackAnimKey,
    });
    if (bossConfig.scale) {
      this.boss.sprite.setScale(bossConfig.scale);
    }
    if (bossConfig.originY !== undefined) {
      this.boss.sprite.setOrigin(0.5, bossConfig.originY);
    }
    this.bossDialogue = new DialogueBubble(this, this.boss.container, this.bossName, "boss");

    // 5. In-engine Health Bars
    this.playerHpBar = this.add.graphics();
    this.bossHpBar = this.add.graphics();
    this.renderHealthBars();

    // 6. Bind Bridge Events
    this.setupBridgeListeners();

    // 7. Start Stage Music
    this.audioSystem.playStageMusic(this.stage);

    // 8. Emit ready
    this.bridge.emit("phaser:ready", undefined);
  }

  private getBossConfigForStage(stage: number, name: string) {
    if (stage === 1) {
      return {
        name,
        idleAnimKey: "inquisitor_idle",
        walkAnimKey: "inquisitor_walk",
        attackAnimKey: "inquisitor_attack",
        initialFrameKey: "inquisitor_idle_0",
        scale: 1.25,
        originY: 189 / 256,
      };
    } else if (stage === 2) {
      return {
        name,
        idleAnimKey: "dwarf_idle",
        walkAnimKey: "dwarf_walk",
        attackAnimKey: "dwarf_attack",
        initialFrameKey: "dwarf_idle_0",
        scale: 1.25,
        originY: 188 / 256,
      };
    } else {
      return {
        name,
        idleAnimKey: "reaper_idle",
        walkAnimKey: "reaper_walk",
        attackAnimKey: "reaper_attack",
        initialFrameKey: "reaper_idle_0",
        scale: 1.3,
        originY: 191 / 256,
      };
    }
  }

  private renderHealthBars(): void {
    // Health is now rendered cleanly with Heart icons in React PhaserArena HUD
    this.playerHpBar.clear();
    this.bossHpBar.clear();
  }

  private setupBridgeListeners(): void {
    // 1. Initial Arena setup
    this.bridge.on("react:init_arena", (data: StageInitEvent) => {
      this.stage = data.stage;
      this.bossName = data.boss.name;
      this.playerHp = data.player.hp;
      this.playerMaxHp = data.player.maxHp;
      this.bossHp = data.boss.hp;
      this.bossMaxHp = data.boss.maxHp;

      const bossConfig = this.getBossConfigForStage(this.stage, this.bossName);
      this.boss.setVisual({
        name: this.bossName,
        idleKey: bossConfig.idleAnimKey,
        walkKey: bossConfig.walkAnimKey,
        attackKey: bossConfig.attackAnimKey,
        initialFrameKey: bossConfig.initialFrameKey,
        scale: bossConfig.scale,
        originY: bossConfig.originY,
      });

      this.player.updateHp(this.playerHp, this.playerMaxHp);
      this.boss.updateHp(this.bossHp, this.bossMaxHp);
      this.renderHealthBars();
      this.parallaxSystem.setStageBackground(this.stage, false);
      this.audioSystem.playStageMusic(this.stage);
    });

    // 2. Stage Change: Switch BGM and Background Backdrop when moving to a new round/stage! Also switch Boss Visual!
    this.bridge.on("react:stage_change", (data: { stage: number; bossName: string }) => {
      this.stage = data.stage;
      this.bossName = data.bossName;
      const bossConfig = this.getBossConfigForStage(this.stage, this.bossName);
      this.boss.setVisual({
        name: this.bossName,
        idleKey: bossConfig.idleAnimKey,
        walkKey: bossConfig.walkAnimKey,
        attackKey: bossConfig.attackAnimKey,
        initialFrameKey: bossConfig.initialFrameKey,
        scale: bossConfig.scale,
        originY: bossConfig.originY,
      });
      this.parallaxSystem.setStageBackground(this.stage, true);
      this.audioSystem.playStageMusic(this.stage);
    });

    // 3. Stat update: Update HP bars smoothly without touching audio
    this.bridge.on("react:stat_update", (data: { playerHp: number; playerMaxHp: number; bossHp: number; bossMaxHp: number }) => {
      this.playerHp = data.playerHp;
      this.playerMaxHp = data.playerMaxHp;
      this.bossHp = data.bossHp;
      this.bossMaxHp = data.bossMaxHp;
      this.player.updateHp(this.playerHp, this.playerMaxHp);
      this.boss.updateHp(this.bossHp, this.bossMaxHp);
      this.renderHealthBars();
    });

    // Audio Mute toggle
    this.bridge.on("react:set_audio_muted", (data: { muted: boolean }) => {
      this.audioSystem.setMuted(data.muted);
    });

    // Item Used
    this.bridge.on("react:item_used", (data: ItemUseEvent) => {
      if (data.effectType === "freeze") {
        this.audioSystem.playSfx("sfx_freeze");
      } else if (data.effectType === "shield") {
        this.audioSystem.playSfx("sfx_shield");
      } else {
        this.audioSystem.playSfx("sfx_chest_open");
      }
      this.particleSystem.emitShieldAura(this.player.container.x, this.player.container.y - 30);
      this.playerDialogue.showBubble("Kích hoạt bảo hộ!", 1200);
    });

    // 6. Direct Player Attack (Parallel Text Dialogue + Slash + Hit SFX)
    this.bridge.on("react:player_attack", (data: { damage: number; dialogue?: string }) => {
      this.playerDialogue.showBubble(data.dialogue || "Chém nè!", 1000);
      this.audioSystem.playSfx("sfx_slash");

      this.player.performAttack(
        this.boss.container.x,
        () => {
          this.audioSystem.playSfx("sfx_hit");
          this.boss.takeDamage(data.damage);
          this.particleSystem.emitHitSparks(this.boss.container.x, this.boss.container.y - 40);
          this.bossDialogue.showBubble("Á hự!", 900);
        },
        () => {
          this.bridge.emit("phaser:turn_anim_complete", { outcome: "correct" });
        }
      );
    });

    // 7. Direct Boss Attack on Player (SYNCHRONIZED: Text Dialogue + Audio + Strike Animation trigger together)
    this.bridge.on("react:boss_attack", (data: { damage: number; dialogue?: string }) => {
      // If Stage 2 Grave Wraith (ghost), spawn spectral mist trail
      if (this.stage === 2) {
        this.particleSystem.emitGhostTrail(this.boss.container.x, this.boss.container.y - 40);
      }

      // 1. Kick off boss attack dash & anim at tick 0
      this.boss.performAttack(
        this.player.container.x,
        () => {
          // 2. Play impact sound, shake screen and trigger hit damage right when boss reaches player
          this.audioSystem.playSfx("sfx_boss_hit");
          this.player.takeDamage(data.damage);
          this.cameras.main.shake(250, 0.015);
          const hitColor = this.stage === 2 ? 0x22d3ee : 0xf43f5e;
          this.particleSystem.emitHitSparks(this.player.container.x, this.player.container.y - 40, hitColor);
          this.playerDialogue.showBubble("Đau quá!", 900);
        },
        () => {
          this.bridge.emit("phaser:turn_anim_complete", { outcome: "incorrect" });
        }
      );

      // 2. Synchronized: show dialogue bubble & whoosh sound at the exact same moment attack starts
      this.bossDialogue.showBubble(data.dialogue || "Trúng chiêu đi!", 1000);
      this.audioSystem.playSfx("sfx_boss_attack");
    });

    // 8. Boss Defeat
    this.bridge.on("react:boss_defeat", () => {
      this.audioSystem.playSfx("sfx_hit", 1.4);
      this.boss.takeDamage(100);
      this.bossDialogue.showBubble("Không thể nào...!", 1500);
    });

    // Turn Outcome - Synchronize health stats smoothly
    this.bridge.on("react:turn_outcome", (event: TurnOutcomeEvent) => {
      if (event.outcome === "correct") {
        this.bossHp = event.newBossHp;
        this.renderHealthBars();
      } else {
        this.playerHp = event.newPlayerHp;
        this.renderHealthBars();
      }
    });

    // Game Result
    this.bridge.on("react:game_result", (data: { result: "victory" | "defeat" }) => {
      if (data.result === "victory") {
        this.audioSystem.playVictoryJingle();
        this.playerDialogue.showBubble("Chiến thắng!", 2500);
        this.tweens.add({
          targets: this.player.container,
          y: this.player.container.y - 20,
          duration: 300,
          yoyo: true,
          repeat: 4,
        });
      } else {
        this.bossDialogue.showBubble("Thất bại rồi!", 2500);
      }
    });
  }

  destroy(): void {
    this.audioSystem.destroy();
    this.playerDialogue.destroy();
    this.bossDialogue.destroy();
    this.player.destroy();
    this.boss.destroy();
  }
}
