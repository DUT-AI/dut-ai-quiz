import Phaser from "phaser";

export class DialogueBubble {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bubbleContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, parentContainer: Phaser.GameObjects.Container, _name: string, _role: "player" | "boss") {
    this.scene = scene;
    this.container = parentContainer;
  }

  /**
   * Shows a popping cartoon comic speech bubble with spring animation
   */
  showBubble(text: string, durationMs: number = 1600): void {
    if (this.bubbleContainer) {
      this.bubbleContainer.destroy();
      this.bubbleContainer = null;
    }

    this.bubbleContainer = this.scene.add.container(0, -145);

    const bubbleWidth = Math.max(100, text.length * 8 + 32);
    const bubbleHeight = 36;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0xffffff, 0.96);
    bg.lineStyle(2, 0x1e293b, 1);
    bg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 10);
    bg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 10);

    // Bubble pointer tail
    bg.beginPath();
    bg.moveTo(-6, bubbleHeight / 2);
    bg.lineTo(0, bubbleHeight / 2 + 10);
    bg.lineTo(6, bubbleHeight / 2);
    bg.closePath();
    bg.fillPath();
    bg.strokePath();

    const bubbleText = this.scene.add.text(0, 0, text, {
      fontFamily: "sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#0f172a",
    });
    bubbleText.setOrigin(0.5, 0.5);

    this.bubbleContainer.add([bg, bubbleText]);
    this.container.add(this.bubbleContainer);

    // Spring pop-up animation
    this.bubbleContainer.setScale(0);
    this.scene.tweens.add({
      targets: this.bubbleContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        // Fade out after duration
        this.scene.time.delayedCall(durationMs, () => {
          if (this.bubbleContainer) {
            this.scene.tweens.add({
              targets: this.bubbleContainer,
              alpha: 0,
              y: this.bubbleContainer.y - 15,
              duration: 250,
              onComplete: () => {
                if (this.bubbleContainer) {
                  this.bubbleContainer.destroy();
                  this.bubbleContainer = null;
                }
              },
            });
          }
        });
      },
    });
  }

  destroy(): void {
    if (this.bubbleContainer) this.bubbleContainer.destroy();
  }
}
