import Phaser from "phaser";

export type GameSfxKey =
  | "sfx_slash"
  | "sfx_hit"
  | "sfx_boss_attack"
  | "sfx_boss_hit"
  | "sfx_shield"
  | "sfx_parry"
  | "sfx_fireball"
  | "sfx_spell_impact"
  | "sfx_freeze"
  | "sfx_rock_wall"
  | "sfx_chest_open";

export class AudioSystem {
  private scene: Phaser.Scene;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentStage: number | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;
  private unlockHandler: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload(): void {
    const bgmBase = "/assets/soundtrack/gegx-rpg-music-free-v1.0/music";

    // Round 1: Adventure / Forest
    this.scene.load.audio("bgm_round_1", [
      `${bgmBase}/adventure_begins/adventure_begins_loop.ogg`,
      `${bgmBase}/adventure_begins/adventure_begins_loop.wav`,
    ]);

    // Round 2: Cave / Mystery
    this.scene.load.audio("bgm_round_2", [
      `${bgmBase}/cave/cave_loop.ogg`,
      `${bgmBase}/cave/cave_loop.wav`,
    ]);

    // Round 3: Abandoned Hall / Boss
    this.scene.load.audio("bgm_round_3", [
      `${bgmBase}/abandoned_hall/abandoned_hall_loop.ogg`,
      `${bgmBase}/abandoned_hall/abandoned_hall_loop.wav`,
    ]);

    // Victory Fanfare
    this.scene.load.audio("jingle_victory", [
      `${bgmBase}/jingles/victory.ogg`,
      `${bgmBase}/jingles/victory.wav`,
    ]);

    // === Free Fantasy SFX Pack By TomMusic (Replaces all old placeholder SFX) ===
    const sfxBase = "/assets/sound-effect/Free Fantasy SFX Pack By TomMusic/WAV Files/SFX";
    const swordImpactHit2 = [
      "/assets/sound-effect/Free Fantasy SFX Pack By TomMusic/OGG Files/SFX/Attacks/Sword Attacks Hits and Blocks/Sword Impact Hit 2.ogg",
      "/assets/sound-effect/Free Fantasy SFX Pack By TomMusic/WAV Files/SFX/Attacks/Sword Attacks Hits and Blocks/Sword Impact Hit 2.wav",
    ];

    // 1. Sword & Physical Attacks
    this.scene.load.audio("sfx_slash", `${sfxBase}/Attacks/Sword Attacks Hits and Blocks/Sword Attack 1.wav`);
    this.scene.load.audio("sfx_hit", swordImpactHit2);
    this.scene.load.audio("sfx_parry", `${sfxBase}/Attacks/Sword Attacks Hits and Blocks/Sword Parry 1.wav`);
    this.scene.load.audio("sfx_shield", `${sfxBase}/Attacks/Sword Attacks Hits and Blocks/Sword Blocked 1.wav`);

    // 2. Boss & Spells Attacks (Both using Sword Impact Hit 2 for impacts when attacked)
    this.scene.load.audio("sfx_boss_attack", `${sfxBase}/Spells/Rock Meteor Throw 1.wav`);
    this.scene.load.audio("sfx_boss_hit", swordImpactHit2);
    this.scene.load.audio("sfx_fireball", `${sfxBase}/Spells/Fireball 1.wav`);
    this.scene.load.audio("sfx_spell_impact", `${sfxBase}/Spells/Spell Impact 2.wav`);

    // 3. Items & Buffs SFX
    this.scene.load.audio("sfx_freeze", `${sfxBase}/Spells/Ice Freeze 1.wav`);
    this.scene.load.audio("sfx_rock_wall", `${sfxBase}/Spells/Rock Wall 1.wav`);
    this.scene.load.audio("sfx_chest_open", `${sfxBase}/Doors Gates and Chests/Chest Open 1.wav`);
  }

  create(isInitiallyMuted: boolean = false): void {
    this.isMuted = isInitiallyMuted;
    this.scene.sound.mute = this.isMuted;

    // Attach global window listeners to unlock WebAudio as soon as user clicks anywhere
    if (typeof window !== "undefined") {
      this.unlockHandler = () => {
        if (this.scene.sound && this.scene.sound.locked) {
          this.scene.sound.unlock();
        }

        // Resume or start current stage music once unlocked
        if (this.currentStage !== null) {
          if (!this.currentMusic || !this.currentMusic.isPlaying) {
            const stageToPlay = this.currentStage;
            this.currentStage = null; // force restart on unlock
            this.playStageMusic(stageToPlay);
          }
        }

        // Clean up listeners once unlocked
        if (this.unlockHandler) {
          window.removeEventListener("pointerdown", this.unlockHandler);
          window.removeEventListener("keydown", this.unlockHandler);
          this.unlockHandler = null;
        }
      };

      window.addEventListener("pointerdown", this.unlockHandler);
      window.addEventListener("keydown", this.unlockHandler);
    }
  }

  /**
   * Plays stage appropriate background music.
   * If the requested stage equals currentStage, preserve continuous playback.
   */
  playStageMusic(stage: number): void {
    const targetStage = Phaser.Math.Clamp(stage, 1, 3);
    const trackKey = `bgm_round_${targetStage}`;

    if (this.currentStage === targetStage && this.currentMusic && this.currentMusic.isPlaying) {
      return;
    }

    const isStageTransition = this.currentStage !== null && this.currentStage !== targetStage;
    this.currentStage = targetStage;

    if (this.currentMusic && this.currentMusic.isPlaying) {
      if (isStageTransition) {
        const oldMusic = this.currentMusic;
        this.scene.tweens.add({
          targets: oldMusic,
          volume: 0,
          duration: 700,
          onComplete: () => {
            oldMusic.stop();
            oldMusic.destroy();
          },
        });
      } else {
        return;
      }
    }

    if (this.scene.sound.locked) {
      return;
    }

    if (!this.scene.cache.audio.exists(trackKey)) {
      return;
    }

    try {
      this.currentMusic = this.scene.sound.add(trackKey, {
        loop: true,
        volume: this.masterVolume,
      });
      this.currentMusic.play();
    } catch (err) {
      console.warn("[AudioSystem] Autoplay blocked, will play after user gesture:", err);
    }
  }

  /**
   * Plays victory jingle
   */
  playVictoryJingle(): void {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
    }

    if (this.scene.cache.audio.exists("jingle_victory")) {
      const victorySound = this.scene.sound.add("jingle_victory", {
        loop: false,
        volume: this.masterVolume,
      });
      victorySound.play();
    }
  }

  /**
   * Plays hit impact, slash, spells or item sound effects from Fantasy Pack
   */
  playSfx(key: GameSfxKey, volMultiplier: number = 1.0): void {
    if (this.isMuted || this.scene.sound.mute || this.scene.sound.locked) {
      return;
    }

    if (this.scene.cache.audio.exists(key)) {
      try {
        this.scene.sound.play(key, {
          volume: Math.min(1.0, this.masterVolume * 1.2 * volMultiplier),
        });
      } catch (err) {
        console.warn(`[AudioSystem] Failed to play SFX ${key}:`, err);
      }
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.scene.sound.mute = muted;
  }

  setVolume(vol: number): void {
    this.masterVolume = Phaser.Math.Clamp(vol, 0, 1);
    this.scene.sound.volume = this.masterVolume;
  }

  destroy(): void {
    if (this.unlockHandler && typeof window !== "undefined") {
      window.removeEventListener("pointerdown", this.unlockHandler);
      window.removeEventListener("keydown", this.unlockHandler);
      this.unlockHandler = null;
    }

    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }
}
