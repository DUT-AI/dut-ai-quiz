import Phaser from "phaser";

export class ParticleSystem {
  private scene: Phaser.Scene;
  private sparkTextureCreated = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preload particle graphics if needed, or create programmatically
   */
  create(): void {
    if (!this.sparkTextureCreated && !this.scene.textures.exists("spark_particle")) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xfff385, 1);
      graphics.fillCircle(4, 4, 4);
      graphics.fillStyle(0xff8800, 0.8);
      graphics.fillCircle(4, 4, 2);
      graphics.generateTexture("spark_particle", 8, 8);
      graphics.destroy();
      this.sparkTextureCreated = true;
    }
  }

  /**
   * Emits a burst of cartoon slash sparks at impact coordinate
   */
  emitHitSparks(x: number, y: number, colorTint: number = 0xffe066): void {
    if (!this.sparkTextureCreated) this.create();

    const emitter = this.scene.add.particles(x, y, "spark_particle", {
      speed: { min: 80, max: 240 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: colorTint,
      lifespan: 350,
      gravityY: 120,
      quantity: 18,
      emitting: false,
    });

    emitter.explode(18);

    this.scene.time.delayedCall(400, () => {
      emitter.destroy();
    });
  }

  /**
   * Emits a magical shield aura around player
   */
  emitShieldAura(x: number, y: number): void {
    if (!this.sparkTextureCreated) this.create();

    const emitter = this.scene.add.particles(x, y, "spark_particle", {
      speed: { min: 20, max: 60 },
      scale: { start: 1.2, end: 0.2 },
      alpha: { start: 0.8, end: 0 },
      tint: 0x38bdf8,
      lifespan: 600,
      quantity: 12,
      emitting: false,
    });

    emitter.explode(12);

    this.scene.time.delayedCall(650, () => {
      emitter.destroy();
    });
  }

  /**
   * Emits spooky wraith ghost mist/soul flames when Grave Wraith attacks
   */
  emitGhostTrail(x: number, y: number): void {
    if (!this.sparkTextureCreated) this.create();

    const emitter = this.scene.add.particles(x, y, "spark_particle", {
      speed: { min: 40, max: 140 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.2, end: 0.1 },
      alpha: { start: 0.9, end: 0 },
      tint: 0x22d3ee, // Cyan spirit ghost energy
      lifespan: 500,
      quantity: 24,
      emitting: false,
    });

    emitter.explode(24);

    this.scene.time.delayedCall(550, () => {
      emitter.destroy();
    });
  }
}
