import { useEffect, useState, useCallback } from "react";
import { eventBus, AppEvent } from "@/core/eventBus";

/**
 * Live State Hook
 * 
 * Subscribes to event bus updates and maintains reactive state.
 * Replaces manual polling with event-driven updates.
 */
export function useLiveState<T>(
  initial: T,
  event: AppEvent,
  transform?: (data: any) => T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    const handler = (data: any) => {
      if (transform) {
        setState(transform(data));
      } else {
        setState(data as T);
      }
    };

    const unsubscribe = eventBus.on(event, handler);

    return () => {
      unsubscribe();
    };
  }, [event, transform]);

  const updateState = useCallback((value: T) => {
    setState(value);
  }, []);

  return [state, updateState];
}

/**
 * Live Collection Hook
 * 
 * Maintains a collection that updates in real-time based on events.
 * Useful for lists like leads, activities, notifications.
 */
export function useLiveCollection<T>(
  initial: T[],
  events: {
    onAdd?: AppEvent;
    onUpdate?: AppEvent;
    onDelete?: AppEvent;
  },
  idField: string = "id"
): T[] {
  const [collection, setCollection] = useState<T[]>(initial);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (events.onAdd) {
      unsubscribers.push(
        eventBus.on(events.onAdd, (item: T) => {
          setCollection(prev => [...prev, item]);
        })
      );
    }

    if (events.onUpdate) {
      unsubscribers.push(
        eventBus.on(events.onUpdate, (item: T) => {
          setCollection(prev =>
            prev.map(existing =>
              (existing as any)[idField] === (item as any)[idField] ? item : existing
            )
          );
        })
      );
    }

    if (events.onDelete) {
      unsubscribers.push(
        eventBus.on(events.onDelete, (item: T) => {
          setCollection(prev =>
            prev.filter(existing => (existing as any)[idField] !== (item as any)[idField])
          );
        })
      );
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [events, idField]);

  return collection;
}

/**
 * Live Counter Hook
 * 
 * Tracks a count that updates based on events.
 */
export function useLiveCounter(
  initial: number = 0,
  event: AppEvent,
  delta: number = 1
): number {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const unsubscribe = eventBus.on(event, () => {
      setCount(prev => prev + delta);
    });

    return () => {
      unsubscribe();
    };
  }, [event, delta]);

  return count;
}

/**
 * Live Status Hook
 * 
 * Tracks status changes (online/offline, connected/disconnected, etc.)
 */
export function useLiveStatus(
  initial: string = "unknown",
  event: AppEvent
): string {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    const unsubscribe = eventBus.on(event, (data: any) => {
      setStatus(data?.status || data);
    });

    return () => {
      unsubscribe();
    };
  }, [event]);

  return status;
}
