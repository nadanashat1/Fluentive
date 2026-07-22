import { useState, useEffect, useCallback } from 'react';

interface TimeTrackingData {
  startTime: Date;
  endTime?: Date;
  activity: string;
  duration?: number;
  isBillable: boolean;
}

interface TimeTrackingOptions {
  autoStart: boolean;
  idleTimeout: number; // minutes of inactivity before auto-pause
  notificationThreshold: number; // minutes before warning
}

export function useTimeTracking(options: TimeTrackingOptions = {}) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trackingData, setTrackingData] = useState<TimeTrackingData[]>([]);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  
  // Heartbeat simulation
  const [lastHeartbeat, setLastHeartbeat] = useState(new Date());
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);

  // Auto-pause on inactivity
  const startIdleTimer = useCallback(() => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    const idleTimer = setTimeout(() => {
      if (isTracking) {
        pauseTracking();
      // Show notification or alert user
        console.log('Auto-paused due to inactivity');
      }
    }, options.idleTimeout * 60 * 1000); // Convert to milliseconds
    
    setHeartbeatInterval(idleTimer);
  }, [isTracking, options.idleTimeout]);

  // Clear idle timer on activity
  const clearIdleTimer = useCallback(() => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }
  }, []);

  // Start time tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    const now = new Date();
    setCurrentTime(now);
    setLastHeartbeat(now);
    
    // Start heartbeat
    const interval = setInterval(() => {
      setLastHeartbeat(new Date());
    }, 30000); // Heartbeat every 30 seconds
    
    setHeartbeatInterval(interval);
    
    // Start idle timer if auto-start is enabled
    if (options.autoStart) {
      startIdleTimer();
    }
  }, [options.autoStart, options.idleTimeout]);

  // Pause time tracking
  const pauseTracking = useCallback(() => {
    setIsTracking(false);
    clearIdleTimer();
    
    if (trackingData.length > 0) {
      const lastEntry = trackingData[trackingData.length - 1];
      const now = new Date();
      
      if (!lastEntry.endTime) {
        setTrackingData(prev => [
          ...prev.slice(0, -1),
          {
            ...lastEntry,
            endTime: now,
            duration: (now.getTime() - lastEntry.startTime.getTime()) / 1000 / 60, // minutes
          }
        ]);
        
        setTotalTimeToday(prev => prev + (now.getTime() - lastEntry.startTime.getTime()) / 1000 / 60);
      }
    }
  }, [trackingData]);

  // Resume time tracking
  const resumeTracking = useCallback(() => {
    setIsTracking(true);
    setLastHeartbeat(new Date());
    
    // Restart idle timer
    if (options.autoStart) {
      startIdleTimer();
    }
  }, [options.autoStart, options.idleTimeout]);

  // Manual activity logging
  const logActivity = useCallback((activity: string, isBillable: boolean = false) => {
    const now = new Date();
    
    if (isTracking) {
      setTrackingData(prev => [
        ...prev,
        {
          startTime: now,
          activity,
          isBillable,
        }
      ]);
    }
  }, [isTracking]);

  // Simulate online status changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Simulate connection status changes
    const simulateConnectionChange = () => {
      const online = Math.random() > 0.1; // 90% chance of being online
      setIsOnline(online);
    };

    // Simulate periodic status changes
    const connectionSimulator = setInterval(simulateConnectionChange, 30000); // Every 30 seconds

    // Listen for actual browser events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(connectionSimulator);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update current time
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Calculate total time for today
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    
    const todayTotal = trackingData
      .filter(entry => entry.startTime >= today)
      .reduce((total, entry) => {
        if (entry.duration) {
          return total + entry.duration;
        }
        return total;
      }, 0);
    
    setTotalTimeToday(todayTotal);
  }, [trackingData]);

  return {
    // State
    isTracking,
    currentTime,
    trackingData,
    totalTimeToday,
    isOnline,
    lastHeartbeat,
    
    // Actions
    startTracking,
    pauseTracking,
    resumeTracking,
    logActivity,
    
    // Computed values
    currentSessionDuration: trackingData.length > 0 && isTracking 
      ? (currentTime.getTime() - trackingData[trackingData.length - 1].startTime.getTime()) / 1000 / 60 
      : 0,
    
    // Status indicators
    isIdle: !isTracking && trackingData.length > 0,
    needsAttention: totalTimeToday > options.notificationThreshold * 60, // Convert hours to minutes
  };
}
