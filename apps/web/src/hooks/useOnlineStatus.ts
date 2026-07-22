import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusData {
  timestamp: Date;
  status: 'online' | 'offline' | 'connecting' | 'error';
  connectionType: 'wifi' | 'ethernet' | 'cellular' | 'vpn' | 'unknown';
  signalStrength?: number; // 0-100
  ipAddress?: string;
  lastSeen?: Date;
}

interface OnlineStatusOptions {
  checkInterval: number; // milliseconds
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  autoReconnect: boolean;
}

export function useOnlineStatus(options: OnlineStatusOptions = { 
  checkInterval: 5000, 
  reconnectAttempts: 3, 
  maxReconnectAttempts: 3, 
  autoReconnect: true 
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusData[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Check online status
  const checkOnlineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/online-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': 'online-status-check'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const newStatusData: OnlineStatusData = {
          timestamp: new Date(),
          status: navigator.onLine ? 'online' : 'offline',
          connectionType: 'wifi', // Default, would be detected from API
          signalStrength: Math.floor(Math.random() * 100), // Simulated
          ipAddress: data.ipAddress || '192.168.1.100',
          lastSeen: new Date()
        };
        
        setOnlineStatus(prev => [...prev.slice(-9), newStatusData]);
        setIsOnline(navigator.onLine);
        
        return data;
      } else {
        throw new Error('Failed to check online status');
      }
    } catch (error) {
      console.error('Online status check failed:', error);
      
      const errorStatusData: OnlineStatusData = {
        timestamp: new Date(),
        status: 'error',
        connectionType: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setOnlineStatus(prev => [...prev.slice(-9), errorStatusData]);
      setIsOnline(false);
      
      throw error;
    }
  }, []);

  // Auto-reconnect functionality
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttempts < options.maxReconnectAttempts && options.autoReconnect) {
      setReconnectAttempts(prev => prev + 1);
      
      try {
        await checkOnlineStatus();
        
        // Simulate reconnection success
        setTimeout(() => {
          setReconnectAttempts(0);
        }, 2000);
      } catch (error) {
        console.error('Reconnect attempt failed:', error);
      }
    }
  }, [reconnectAttempts, options.maxReconnectAttempts, options.autoReconnect]);

  // Monitor online status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkOnlineStatus();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      checkOnlineStatus();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodic status checks
    const statusInterval = setInterval(() => {
      checkOnlineStatus();
    }, options.checkInterval);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, [checkOnlineStatus, options.checkInterval]);

  // Calculate connection quality
  const getConnectionQuality = useCallback(() => {
    if (onlineStatus.length === 0) return 'unknown';
    
    const recentStatuses = onlineStatus.slice(-5);
    const onlineCount = recentStatuses.filter(s => s.status === 'online').length;
    const qualityScore = (onlineCount / 5) * 100;
    
    if (qualityScore >= 80) return 'excellent';
    if (qualityScore >= 60) return 'good';
    if (qualityScore >= 40) return 'fair';
    return 'poor';
  }, [onlineStatus]);

  return {
    // State
    isOnline,
    onlineStatus,
    reconnectAttempts,
    
    // Computed values
    connectionQuality: getConnectionQuality(),
    currentStatus: onlineStatus.length > 0 ? onlineStatus[onlineStatus.length - 1] : null,
    lastStatusChange: onlineStatus.length > 1 ? 
      onlineStatus[onlineStatus.length - 1].timestamp : 
      new Date(),
    
    // Actions
    checkOnlineStatus,
    attemptReconnect
  };
}
