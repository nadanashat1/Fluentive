/**
 * Event-Driven UI Core
 * 
 * Central event bus for real-time UI updates.
 * Replaces manual polling and page refreshes with reactive event streams.
 */

export type AppEvent =
  | "data:update"
  | "lead:created"
  | "lead:updated"
  | "lead:deleted"
  | "db:status"
  | "ai:insight"
  | "ui:alert"
  | "ui:mode"
  | "connection:status"
  | "time_tracking:heartbeat"
  | "time_tracking:session_start"
  | "time_tracking:session_end"
  | "user:online"
  | "user:offline";

type EventHandler = (data?: any) => void;

class EventBus {
  private events = new Map<AppEvent, EventHandler[]>();

  /**
   * Subscribe to an event
   */
  on(event: AppEvent, callback: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.events.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event with optional data
   */
  emit(event: AppEvent, data?: any): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  off(event: AppEvent): void {
    this.events.delete(event);
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: AppEvent): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
