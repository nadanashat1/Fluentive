import { useState, useEffect, useCallback } from 'react';

interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'idle' | 'away';
  lastSeen: number; // Unix timestamp
  lastHeartbeat: number; // Unix timestamp
  activeSessionStart?: number; // Unix timestamp
  totalActiveTime: number; // Total minutes active today
  currentSessionTime: number; // Current session minutes
}

interface UserPresenceOptions {
  userId: string;
  heartbeatInterval?: number; // milliseconds
  idleTimeout?: number; // milliseconds of inactivity before idle
  autoStart?: boolean;
}

export function useUserPresence(options: UserPresenceOptions) {
  const [presence, setPresence] = useState<UserPresence>({
    userId: options.userId,
    status: 'online',
    lastSeen: Date.now(),
    lastHeartbeat: Date.now(),
    totalActiveTime: 0,
    currentSessionTime: 0
  });

  const [isTracking, setIsTracking] = useState(options.autoStart || false);

  // Heartbeat management
  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': options.userId
        },
        body: JSON.stringify({
          status: presence.status,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        setPresence(prev => ({
          ...prev,
          lastHeartbeat: Date.now(),
          status: 'online'
        }));
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
      setPresence(prev => ({
        ...prev,
        status: 'offline'
      }));
    }
  }, [options.userId]);

  // Idle detection
  const startIdleTimer = useCallback(() => {
    const idleTimer = setTimeout(() => {
      if (presence.status === 'online') {
        setPresence(prev => ({
          ...prev,
          status: 'idle'
        }));
      }
    }, options.idleTimeout || 300000); // 5 minutes default

    return idleTimer;
  }, [options.idleTimeout, presence.status]);

  const clearIdleTimer = useCallback(() => {
    // Clear any existing idle timer
  }, []);

  // Activity detection
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    
    setPresence(prev => ({
      ...prev,
      lastSeen: now,
      status: 'online'
    }));

    if (!isTracking) {
      setIsTracking(true);
      setPresence(prev => ({
        ...prev,
        activeSessionStart: now
      }));
    }

    // Restart idle timer
    clearIdleTimer();
    startIdleTimer();
  }, [isTracking, options.idleTimeout, presence.status]);

  // Start presence tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    setPresence(prev => ({
      ...prev,
      status: 'online',
      activeSessionStart: Date.now()
    }));
    startIdleTimer();
    
    // Send initial heartbeat
    sendHeartbeat();
  }, [sendHeartbeat, startIdleTimer]);

  // Stop presence tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    if (presence.activeSessionStart) {
      const sessionDuration = (Date.now() - presence.activeSessionStart) / 1000 / 60; // minutes
      const newTotalTime = presence.totalActiveTime + sessionDuration;
      
      setPresence(prev => ({
        ...prev,
        status: 'offline',
        currentSessionTime: sessionDuration,
        totalActiveTime: newTotalTime,
        activeSessionStart: undefined
      }));
    }
    
    clearIdleTimer();
  }, [presence.activeSessionStart, presence.totalActiveTime]);

  // Update current session time
  useEffect(() => {
    if (isTracking && presence.activeSessionStart) {
      const interval = setInterval(() => {
        const currentSessionTime = (Date.now() - presence.activeSessionStart!) / 1000 / 60;
        setPresence(prev => ({
          ...prev,
          currentSessionTime
        }));
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [isTracking, presence.activeSessionStart]);

  // Auto-heartbeat
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        sendHeartbeat();
      }, options.heartbeatInterval || 30000); // 30 seconds default

      return () => clearInterval(interval);
    }
  }, [isTracking, sendHeartbeat, options.heartbeatInterval]);

  // Reset daily time at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Midnight

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setPresence(prev => ({
        ...prev,
        totalActiveTime: 0,
        currentSessionTime: 0
      }));
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [options.userId]);

  return {
    // State
    presence,
    isTracking,
    
    // Computed values
    isOnline: presence.status === 'online',
    isIdle: presence.status === 'idle',
    isAway: presence.status === 'away',
    sessionDuration: presence.currentSessionTime,
    totalTimeToday: presence.totalActiveTime,
    lastSeen: new Date(presence.lastSeen),
    
    // Actions
    startTracking,
    stopTracking,
    handleUserActivity
  };
}
