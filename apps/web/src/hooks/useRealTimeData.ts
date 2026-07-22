'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { createDashboardWebSocket, useWebSocket } from '@/services/websocketService';
import { authService } from '@/services/authService';

interface RealTimeData {
  activeUsers: number;
  totalRevenue: number;
  newLeads: number;
  activeDeals: number;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  teamActivity: Array<{
    id: string;
    name: string;
    action: string;
    timestamp: Date;
    status: 'completed' | 'in-progress' | 'pending';
  }>;
}

interface RealTimeDataOptions {
  updateInterval?: number; // milliseconds
  enableWebSocket?: boolean;
  userId?: string;
}

export function useRealTimeData(options: RealTimeDataOptions = {}) {
  const [data, setData] = useState<RealTimeData>({
    activeUsers: 1247,
    totalRevenue: 2400000,
    newLeads: 347,
    activeDeals: 89,
    systemHealth: {
      uptime: 99.8,
      responseTime: 1.2,
      errorRate: 0.2
    },
    teamActivity: []
  });

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real WebSocket connection using WebSocket service
  const connectWebSocket = useCallback(() => {
    if (!options.enableWebSocket || !options.userId) return;

    try {
      const wsService = createDashboardWebSocket(options.userId);
      
      wsService.connect().then(() => {
        setIsConnected(true);
        console.log('WebSocket connected');
        
        // Subscribe to real-time data updates
        wsService.subscribe('dashboard-update', (data) => {
          setData(prevData => ({ ...prevData, ...data }));
          setLastUpdate(new Date());
        });
        
        wsService.subscribe('system-health', (data) => {
          setData(prevData => ({
            ...prevData,
            systemHealth: { ...prevData.systemHealth, ...data }
          }));
          setLastUpdate(new Date());
        });
        
      }).catch(error => {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      });

      return () => {
        wsService.disconnect();
      };
    } catch (error) {
      console.error('WebSocket setup error:', error);
      setIsConnected(false);
    }
  }, [options.enableWebSocket, options.userId]);

  // Polling fallback for real-time data using API service
  const fetchData = useCallback(async () => {
    try {
      const response = await apiService.getRealTimeData();
      
      if (response.success && response.data) {
        setData(prevData => ({ ...prevData, ...(response.data as RealTimeData) }));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  }, []);

  // Initialize real-time connection
  useEffect(() => {
    const cleanup = connectWebSocket();
    
    // Set up polling as fallback
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchData();
      }
    }, options.updateInterval || 5000);

    // Initial data fetch
    fetchData();

    return () => {
      if (cleanup) cleanup();
      clearInterval(interval);
    };
  }, [connectWebSocket, fetchData, options.updateInterval, isConnected]);

  // Manual refresh
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Simulate real-time updates (for demo purposes)
  const simulateRealTimeUpdate = useCallback((type: string, value: any) => {
    setData(prev => {
      const update = { [type]: value };
      return { ...prev, ...update };
    });
    setLastUpdate(new Date());
  }, []);

  return {
    // State
    data,
    isConnected,
    lastUpdate,
    
    // Actions
    refreshData,
    simulateRealTimeUpdate,
    
    // Computed values
    isOnline: isConnected,
    dataAge: Math.floor((Date.now() - lastUpdate.getTime()) / 1000), // seconds ago
  };
}
