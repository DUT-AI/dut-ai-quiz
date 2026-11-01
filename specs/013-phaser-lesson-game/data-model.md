# Data Model: Phaser 2D Cartoon Battle Arena

**Feature**: 2D Cartoon Browser Game Engine with Phaser in Lesson UI  
**Branch**: `013-phaser-lesson-game`  
**Date**: 2026-11-01  

## 1. Domain Entities & Interfaces

### 1.1 Character Entity (`CharacterEntity`)
Represents an animated 2D character on the Phaser battle stage (Player or Boss/Enemy).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (`"player"` \| `"boss"`) |
| `name` | `string` | Display name for the character nametag |
| `role` | `"player"` \| `"boss"` | Role determining stance, position, and targeting |
| `currentHp` | `number` | Current health points |
| `maxHp` | `number` | Maximum health points |
| `facing` | `"east"` \| `"west"` | Horizontal facing direction |
| `state` | `"idle"` \| `"walk"` \| `"attack"` \| `"hurt"` \| `"dead"` | Current animation state machine state |
| `sprite` | `Phaser.GameObjects.Sprite` | Rendered Phaser sprite object |
| `container` | `Phaser.GameObjects.Container` | Container grouping sprite, nametag, and dialogue bubble |

---

### 1.2 Dialogue Bubble Entity (`DialogueBubble`)
Represents a comic-style cartoon speech bubble anchored above a character's head.

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | Short message (e.g., "Take that!", "Ouch!", "Shield Up!") |
| `variant` | `"normal"` \| `"shout"` \| `"danger"` | Visual styling (background, border, font color) |
| `durationMs` | `number` | Display duration before auto-fadeout (default 1200ms) |
| `anchorOffset` | `{ x: number, y: number }` | Offset relative to character head |

---

### 1.3 Arena Environment Model (`ArenaEnvironment`)
Manages the multi-layered parallax background elements and camera parameters.

| Field | Type | Description |
|-------|------|-------------|
| `theme` | `"dungeon"` \| `"forest"` \| `"infernal"` | Current stage theme |
| `layers` | `Array<ParallaxLayer>` | Background layers sorted by depth (`z-index`) |
| `cameraShakeConfig` | `{ intensity: number, duration: number }` | Configuration for impact shakes |

#### Sub-type: `ParallaxLayer`
- `key`: `string` (texture key)
- `scrollFactorX`: `number` (0.0 to 1.0)
- `scrollFactorY`: `number` (0.0 to 1.0)
- `depth`: `number`
- `tileSprite`: `Phaser.GameObjects.TileSprite` (if repeating)

---

### 1.4 Bridge Action Models (`BridgeActions`)
Payloads sent across the React <-> Phaser bridge.

#### `TurnResultPayload`
```typescript
interface TurnResultPayload {
  outcome: "correct" | "incorrect" | "timeout";
  playerDamage: number;
  bossDamage: number;
  playerHp: number;
  bossHp: number;
  activeBuffs?: {
    shield?: boolean;
    double?: boolean;
  };
  dialogueText?: string;
}
```

#### `ArenaSyncPayload`
```typescript
interface ArenaSyncPayload {
  stage: number;
  bossName: string;
  monsterType: "slime" | "golem" | "eye" | "reaper";
  playerHp: number;
  playerMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
}
```

---

### 1.5 Audio System Models (`AudioSystem`)

#### `TrackConfig`
| Field | Type | Description |
|-------|------|-------------|
| `trackKey` | `string` | Unique track identifier (e.g., `"adventure_begins"`, `"forest"`) |
| `introUrl` | `string` | URL to intro audio file (optional) |
| `loopUrl` | `string` | URL to main looping audio file |
| `volume` | `number` | Master volume scaling factor (0.0 to 1.0) |
| `isJingle` | `boolean` | If true, does not loop and plays once (e.g. victory) |

#### `AudioState`
| Field | Type | Description |
|-------|------|-------------|
| `isMuted` | `boolean` | Whether audio is currently muted |
| `masterVolume` | `number` | Current volume level (0.0 - 1.0) |
| `currentTrackKey` | `string \| null` | Currently active track key |
| `isUnlocked` | `boolean` | Whether browser WebAudio context has been unlocked by user gesture |


---

## 2. State Machine Transitions

### Character Animation State Machine

```text
[Idle] ──────── (On Turn Correct) ────────► [Walk / Dash Forward]
  ▲                                                   │
  │                                                   ▼
  │                                           [Valiant_Slash Attack]
  │                                                   │
  │                                                   ▼
  └─────── (Slash Complete / Retreat) ◄───────────────┘

[Boss Idle] ──── (On Turn Incorrect) ─────► [Walk / Advance]
  ▲                                                   │
  │                                                   ▼
  │                                            [Void_Strike Attack]
  │                                                   │
  │                                                   ▼
  └─────── (Strike Complete / Return) ◄───────────────┘
```
