import type { BridgeEvents, EventKey, EventPayload, IPhaserBridge } from "./types";

type Listener<K extends EventKey> = (payload: EventPayload<K>) => void;

/**
 * Decoupled event bus enabling bidirectional communication
 * between React state and the Phaser Game engine instance.
 */
export class PhaserGameBridge implements IPhaserBridge {
  private listeners: Map<EventKey, Set<Listener<any>>> = new Map();

  emit<K extends EventKey>(event: K, payload: EventPayload<K>): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[PhaserGameBridge] Error in handler for event "${event}":`, err);
      }
    });
  }

  on<K extends EventKey>(event: K, handler: Listener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(handler);

    // Return cleanup unbind function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  destroy(): void {
    this.listeners.clear();
  }
}
