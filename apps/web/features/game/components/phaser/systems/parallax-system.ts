import Phaser from "phaser";

export class ParallaxSystem {
  private scene: Phaser.Scene;
  private currentBgImage: Phaser.GameObjects.Image | null = null;
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.width = scene.cameras.main.width;
    this.height = scene.cameras.main.height;
  }

  preload(): void {
    const bgBase = "/assets/background/nashas_battle_backdrops_free_haunted_battles_v1/1280x720";
    // Stage 1 (Bone Inquisitor): Haunted Graveyard
    this.scene.load.image("bg_stage_1", `${bgBase}/haunted_graveyard.png`);
    // Stage 2 (Grave Wraith): Cursed Swamp
    this.scene.load.image("bg_stage_2", `${bgBase}/cursed_swamp.png`);
    // Stage 3 (Void Reaper): Haunted Hall
    this.scene.load.image("bg_stage_3", `${bgBase}/haunted_hall.png`);
  }

  create(initialStage: number = 1): void {
    this.setStageBackground(initialStage, false);
  }

  /**
   * Cross-fade background smoothly when stage changes
   */
  setStageBackground(stage: number, animate: boolean = true): void {
    const targetStage = Phaser.Math.Clamp(stage, 1, 3);
    const textureKey = `bg_stage_${targetStage}`;

    if (!this.scene.textures.exists(textureKey)) {
      return;
    }

    const newBg = this.scene.add.image(this.width / 2, this.height / 2, textureKey);
    newBg.setDisplaySize(this.width, this.height);
    newBg.setDepth(-10);

    if (animate && this.currentBgImage) {
      newBg.setAlpha(0);
      const oldBg = this.currentBgImage;

      this.scene.tweens.add({
        targets: newBg,
        alpha: 1,
        duration: 800,
        ease: "Power2",
      });

      this.scene.tweens.add({
        targets: oldBg,
        alpha: 0,
        duration: 800,
        ease: "Power2",
        onComplete: () => {
          oldBg.destroy();
        },
      });
    } else {
      newBg.setAlpha(1);
      if (this.currentBgImage) {
        this.currentBgImage.destroy();
      }
    }

    this.currentBgImage = newBg;
  }

  destroy(): void {
    if (this.currentBgImage) {
      this.currentBgImage.destroy();
      this.currentBgImage = null;
    }
  }
}
