// Infrastructure Module - Event bus for observability
export interface EventData {
  tenantId?: string;
  userId?: string;
  timestamp?: Date;
  [key: string]: any;
}

export class EventBus {
  private static listeners = new Map<string, Function[]>();
  private static eventQueue: Array<{ event: string; data: EventData }> = [];
  private static processing = false;

  // Emit event - fire-and-forget (non-blocking)
  static emit(event: string, data: EventData): void {
    // Add to queue for async processing
    this.eventQueue.push({ event, data });
    
    // Process queue asynchronously
    if (!this.processing) {
      this.processing = true;
      setImmediate(() => this.processQueue());
    }
  }

  // Listen to events (for observability systems)
  static on(event: string, listener: (data: EventData) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  // Remove event listener
  static off(event: string, listener: (data: EventData) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Process event queue asynchronously
  private static async processQueue(): Promise<void> {
    try {
      while (this.eventQueue.length > 0) {
        const { event, data } = this.eventQueue.shift()!;
        
        // Notify listeners (non-blocking)
        const listeners = this.listeners.get(event) || [];
        for (const listener of listeners) {
          try {
            setImmediate(() => listener(data));
          } catch (error) {
            console.error(`Event listener error for ${event}:`, error);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // Get event statistics
  static getStats(): {
    queueSize: number;
    processing: boolean;
    listenerCount: number;
  } {
    return {
      queueSize: this.eventQueue.length,
      processing: this.processing,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
    };
  }

  // Clear all listeners
  static clear(): void {
    this.listeners.clear();
    this.eventQueue = [];
    this.processing = false;
  }
}
