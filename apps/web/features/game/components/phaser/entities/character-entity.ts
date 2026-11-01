import Phaser from "phaser";

export interface CharacterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  role: "player" | "boss";
  name: string;
  initialHp: number;
  maxHp: number;
  idleAnimKey: string;
  walkAnimKey: string;
  attackAnimKey: string;
}

export class CharacterEntity {
  public scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public sprite: Phaser.GameObjects.Sprite;
  public role: "player" | "boss";
  public name: string;
  public hp: number;
  public maxHp: number;

  private idleKey: string;
  private walkKey: string;
  private attackKey: string;
  private originalX: number;
  private originalY: number;
  private isAttacking: boolean = false;

  constructor(config: CharacterConfig) {
    this.scene = config.scene;
    this.role = config.role;
    this.name = config.name;
    this.hp = config.initialHp;
    this.maxHp = config.maxHp;
    this.idleKey = config.idleAnimKey;
    this.walkKey = config.walkAnimKey;
    this.attackKey = config.attackAnimKey;
    this.originalX = config.x;
    this.originalY = config.y;

    // Create Container to hold sprite, name tag, dialogue bubbles
    this.container = this.scene.add.container(config.x, config.y);

    // Initial sprite frame
    const initialFrameKey = this.role === "player" ? "knight_idle_0" : "reaper_idle_0";
    this.sprite = this.scene.add.sprite(0, 0, initialFrameKey);

    // Anchor precisely at the character's feet (y=190 in 256x256 sprite canvas)
    // so both Player and Boss stand exactly on container.y (ground floor), regardless of scale
    const defaultOriginY = 190 / 256;
    this.sprite.setOrigin(0.5, defaultOriginY);

    // Scaling
    const scale = this.role === "boss" ? 1.25 : 1.2;
    this.sprite.setScale(scale);

    this.container.add(this.sprite);

    // Start idle animation
    this.playIdle();
  }

  playIdle(): void {
    if (this.scene.anims.exists(this.idleKey)) {
      this.sprite.play(this.idleKey);
    }
    // Restore default facing direction: Player faces East (flipX=false), Boss faces West (flipX=false)
    this.sprite.setFlipX(false);
  }

  setVisual(config: {
    name: string;
    idleKey: string;
    walkKey: string;
    attackKey: string;
    initialFrameKey: string;
    scale?: number;
    originY?: number;
  }): void {
    this.name = config.name;
    this.idleKey = config.idleKey;
    this.walkKey = config.walkKey;
    this.attackKey = config.attackKey;
    if (config.scale) {
      this.sprite.setScale(config.scale);
    }
    if (config.originY !== undefined) {
      this.sprite.setOrigin(0.5, config.originY);
    } else {
      this.sprite.setOrigin(0.5, 190 / 256);
    }
    this.sprite.setTexture(config.initialFrameKey);
    this.playIdle();
  }

  playWalk(): void {
    if (this.scene.anims.exists(this.walkKey)) {
      this.sprite.play(this.walkKey);
    }
  }

  /**
   * Performs an attack dash in parallel with dialogue text, triggers hit on impact, then returns to origin
   */
  performAttack(targetX: number, onHit?: () => void, onComplete?: () => void): void {
    if (this.isAttacking) return;
    this.isAttacking = true;

    const isTargetOnRight = targetX > this.container.x;
    const dashOffset = isTargetOnRight ? -75 : 75;
    const strikeX = targetX + dashOffset;

    // Face the target:
    // Knight sprite assets naturally face East (Right), so target on Right -> flipX=false, target on Left -> flipX=true.
    // Reaper sprite assets naturally face West (Left), so target on Left -> flipX=false, target on Right -> flipX=true.
    const shouldFlip = this.role === "player" ? !isTargetOnRight : isTargetOnRight;
    this.sprite.setFlipX(shouldFlip);

    // 1. PARALLEL: Start attack animation immediately (frame 0) simultaneously with dialogue
    if (this.scene.anims.exists(this.attackKey)) {
      this.sprite.play(this.attackKey);
    }

    // 2. PARALLEL: Swift lunge dash towards target (duration: 150ms)
    this.scene.tweens.add({
      targets: this.container,
      x: strikeX,
      duration: 150,
      ease: "Cubic.easeOut",
      onComplete: () => {
        // Trigger hit impact on strike arrival (hit box connection)
        if (onHit) onHit();

        // 3. Complete attack swing, then return to origin
        let hasReturned = false;
        const returnToOrigin = () => {
          if (hasReturned) return;
          hasReturned = true;

          this.playWalk();
          // Face back to original position when retreating
          const isOriginOnRight = this.originalX > this.container.x;
          const retreatFlip = this.role === "player" ? !isOriginOnRight : isOriginOnRight;
          this.sprite.setFlipX(retreatFlip);

          this.scene.tweens.add({
            targets: this.container,
            x: this.originalX,
            duration: 250,
            ease: "Power2",
            onComplete: () => {
              this.isAttacking = false;
              this.playIdle();
              if (onComplete) onComplete();
            },
          });
        };

        // Listen for standard animationcomplete event
        this.sprite.once("animationcomplete", returnToOrigin);

        // Fallback safety timer
        this.scene.time.delayedCall(650, returnToOrigin);
      },
    });
  }

  /**
   * Flashes red on taking damage and spawns floating damage text
   */
  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);

    // Floating combat text
    if (amount > 0) {
      const dmgText = this.scene.add.text(
        this.container.x,
        this.container.y - 100,
        `-${amount}`,
        {
          fontFamily: "monospace",
          fontSize: "22px",
          color: this.role === "boss" ? "#fbbf24" : "#ef4444",
          stroke: "#000000",
          strokeThickness: 4,
          fontStyle: "bold",
        }
      );
      dmgText.setOrigin(0.5, 0.5);

      this.scene.tweens.add({
        targets: dmgText,
        y: dmgText.y - 45,
        alpha: 0,
        scale: 1.3,
        duration: 700,
        ease: "Power1",
        onComplete: () => {
          dmgText.destroy();
        },
      });
    }

    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xff3333,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.sprite.clearTint();
      },
    });
  }

  updateHp(hp: number, maxHp: number): void {
    this.hp = hp;
    this.maxHp = maxHp;
  }

  destroy(): void {
    this.container.destroy();
  }
}
