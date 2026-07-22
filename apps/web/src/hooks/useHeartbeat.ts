import { useState, useEffect, useCallback, useRef } from 'react';

interface HeartbeatData {
  timestamp: Date;
  status: 'online' | 'offline' | 'warning';
  responseTime?: number;
  error?: string;
}

interface HeartbeatOptions {
  interval: number; // milliseconds between heartbeats
  timeout: number; // milliseconds before considering connection lost
  retryAttempts: number;
  autoReconnect: boolean;
}

export function useHeartbeat(options: HeartbeatOptions = { interval: 30000, timeout: 60000, retryAttempts: 3, autoReconnect: true }) {
  const [isOnline, setIsOnline] = useState(true);
  const [heartbeatData, setHeartbeatData] = useState<HeartbeatData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastResponse, setLastResponse] = useState<number>(Date.now());
  
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  
  // Send heartbeat signal
  const sendHeartbeat = useCallback(async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'X-Heartbeat': 'true',
        'X-Timestamp': startTime.toString(),
        'X-User-ID': 'current-user' // This would come from auth context
        },
        signal: AbortSignal.timeout(options.timeout)
      });
      
      const responseTime = Date.now() - startTime;
      setLastResponse(Date.now());
      
      const newHeartbeatData: HeartbeatData = {
        timestamp: new Date(),
        status: 'online',
        responseTime,
        retryAttempts: retryCountRef.current
      };
      
      setHeartbeatData(prev => [...prev.slice(-9), newHeartbeatData]);
      setConnectionStatus('connected');
      retryCountRef.current = 0;
      
      return response.ok;
    } catch (error) {
      console.error('Heartbeat failed:', error);
      
      const errorHeartbeatData: HeartbeatData = {
        timestamp: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryAttempts: retryCountRef.current + 1
      };
      
      setHeartbeatData(prev => [...prev.slice(-9), errorHeartbeatData]);
      setConnectionStatus('disconnected');
      
      return false;
    }
  }, [options.interval, options.timeout, options.retryAttempts, options.autoReconnect]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    setIsOnline(true);
    setConnectionStatus('connected');
    
    const interval = setInterval(async () => {
      await sendHeartbeat();
    }, options.interval);
    
    return () => clearInterval(interval);
  }, [sendHeartbeat, options.interval]);

  // Check connection health
  const checkConnectionHealth = useCallback(() => {
    const timeSinceLastResponse = Date.now() - lastResponse;
    
    if (timeSinceLastResponse > options.timeout) {
      setConnectionStatus('disconnected');
      
      if (retryCountRef.current < options.retryAttempts) {
        setConnectionStatus('reconnecting');
        setTimeout(() => {
          sendHeartbeat();
        }, 2000); // Wait 2 seconds before retry
      } else {
        setConnectionStatus('disconnected');
        setIsOnline(false);
      }
    } else {
      setConnectionStatus('connected');
    }
  }, [lastResponse, options.timeout, options.retryAttempts, sendHeartbeat]);

  // Monitor connection status and auto-reconnect
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      checkConnectionHealth();
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [checkConnectionHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isOnline,
    connectionStatus,
    heartbeatData,
    lastResponse,
    retryCount: retryCountRef.current,
    
    // Actions
    startHeartbeat,
    sendHeartbeat,
    checkConnectionHealth,
    
    // Computed values
    isHealthy: connectionStatus === 'connected' && (Date.now() - lastResponse) < options.timeout,
    connectionQuality: heartbeatData.length > 0 ? 
      heartbeatData[heartbeatData.length - 1].responseTime : 
      0
  };
}
