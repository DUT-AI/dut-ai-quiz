import Phaser from "phaser";

export class AnimationSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preload key frames for Shield Knight and Bosses from assets/character/
   */
  preload(): void {
    const charBase = "/assets/character";

    // 1. Preload Shield Knight (Player) Idle, Walk & Valiant_Slash (Facing East)
    const knightBase = `${charBase}/shield-knight-FREE/Animations`;
    for (let i = 0; i < 13; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`knight_idle_${i}`, `${knightBase}/Idle/east/frame_${pad}.png`);
    }
    for (let i = 0; i < 12; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`knight_walk_${i}`, `${knightBase}/Walk/east/frame_${pad}.png`);
    }
    for (let i = 0; i < 16; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`knight_slash_${i}`, `${knightBase}/Valiant_Slash/east/frame_${pad}.png`);
    }

    // 2. Preload Bone Inquisitor (Boss Stage 1) Idle, Walk & Inquisitor_Strike (Facing West)
    const inquisitorBase = `${charBase}/bone-inquisitor-FREE/Animations`;
    for (let i = 0; i < 20; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`inquisitor_idle_${i}`, `${inquisitorBase}/Idle/west/frame_${pad}.png`);
    }
    for (let i = 0; i < 14; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`inquisitor_walk_${i}`, `${inquisitorBase}/Walk/west/frame_${pad}.png`);
    }
    for (let i = 0; i < 20; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`inquisitor_strike_${i}`, `${inquisitorBase}/Inquisitor_Strike/west/frame_${pad}.png`);
    }

    // 3. Preload Grave Wraith (Boss Stage 2) Idle (Facing West, frame_001 to frame_012)
    const wraithBase = `${charBase}/grave-wraith-FREE/Animations/Idle/west`;
    for (let i = 1; i <= 12; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`wraith_idle_${i}`, `${wraithBase}/frame_${pad}.png`);
    }

    // 4. Preload Faceless Void Reaper (Boss Stage 3) Idle, Walk & Void_Strike (Facing West)
    const reaperBase = `${charBase}/faceless-void-reaper-FREE/Animations`;
    for (let i = 0; i < 12; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`reaper_idle_${i}`, `${reaperBase}/Idle/west/frame_${pad}.png`);
    }
    for (let i = 0; i < 12; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`reaper_walk_${i}`, `${reaperBase}/Walk/west/frame_${pad}.png`);
    }
    for (let i = 0; i < 16; i++) {
      const pad = String(i).padStart(3, "0");
      this.scene.load.image(`reaper_strike_${i}`, `${reaperBase}/Void_Strike/west/frame_${pad}.png`);
    }
  }

  /**
   * Generate Phaser animations
   */
  create(): void {
    // 1. Knight Animations
    if (!this.scene.anims.exists("knight_idle")) {
      this.scene.anims.create({
        key: "knight_idle",
        frames: Array.from({ length: 13 }, (_, i) => ({ key: `knight_idle_${i}` })),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("knight_walk")) {
      this.scene.anims.create({
        key: "knight_walk",
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `knight_walk_${i}` })),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("knight_attack")) {
      this.scene.anims.create({
        key: "knight_attack",
        frames: Array.from({ length: 16 }, (_, i) => ({ key: `knight_slash_${i}` })),
        frameRate: 16,
        repeat: 0,
      });
    }

    // 2. Bone Inquisitor Animations (Boss Stage 1)
    if (!this.scene.anims.exists("inquisitor_idle")) {
      this.scene.anims.create({
        key: "inquisitor_idle",
        frames: Array.from({ length: 20 }, (_, i) => ({ key: `inquisitor_idle_${i}` })),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("inquisitor_walk")) {
      this.scene.anims.create({
        key: "inquisitor_walk",
        frames: Array.from({ length: 14 }, (_, i) => ({ key: `inquisitor_walk_${i}` })),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("inquisitor_attack")) {
      this.scene.anims.create({
        key: "inquisitor_attack",
        frames: Array.from({ length: 20 }, (_, i) => ({ key: `inquisitor_strike_${i}` })),
        frameRate: 18,
        repeat: 0,
      });
    }

    // 3. Grave Wraith Animations (Boss Stage 2)
    if (!this.scene.anims.exists("wraith_idle")) {
      this.scene.anims.create({
        key: "wraith_idle",
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `wraith_idle_${i + 1}` })),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("wraith_attack")) {
      this.scene.anims.create({
        key: "wraith_attack",
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `wraith_idle_${i + 1}` })),
        frameRate: 16,
        repeat: 0,
      });
    }

    // 4. Reaper Animations (Boss Stage 3)
    if (!this.scene.anims.exists("reaper_idle")) {
      this.scene.anims.create({
        key: "reaper_idle",
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `reaper_idle_${i}` })),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("reaper_walk")) {
      this.scene.anims.create({
        key: "reaper_walk",
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `reaper_walk_${i}` })),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("reaper_attack")) {
      this.scene.anims.create({
        key: "reaper_attack",
        frames: Array.from({ length: 16 }, (_, i) => ({ key: `reaper_strike_${i}` })),
        frameRate: 16,
        repeat: 0,
      });
    }
  }
}
