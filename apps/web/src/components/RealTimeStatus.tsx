'use client';

import { useState, useEffect } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useHeartbeat } from '@/hooks/useHeartbeat';

export function RealTimeStatus() {
  const timeTracking = useTimeTracking({
    autoStart: true,
    idleTimeout: 15,
    notificationThreshold: 480
  });
  
  const onlineStatus = useOnlineStatus({
    checkInterval: 5000,
    reconnectAttempts: 3,
    maxReconnectAttempts: 3,
    autoReconnect: true
  });
  
  const heartbeat = useHeartbeat({
    interval: 30000,
    timeout: 60000,
    retryAttempts: 3,
    autoReconnect: true
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>>([]);

  // Auto-generate alerts based on system status
  useEffect(() => {
    const newAlerts = [];
    
    // Time tracking alerts
    if (timeTracking.needsAttention) {
      newAlerts.push({
        id: `idle-warning-${Date.now()}`,
        type: 'warning',
        message: 'You have been inactive for a while. Consider taking a break or logging your current activity.',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Connection status alerts
    if (onlineStatus.connectionStatus === 'disconnected') {
      newAlerts.push({
        id: `connection-lost-${Date.now()}`,
        type: 'error',
        message: 'Connection to server lost. Attempting to reconnect...',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Heartbeat failure alerts
    if (heartbeat.heartbeatData.length > 0) {
      const recentFailures = heartbeat.heartbeatData
        .filter(h => h.status === 'error')
        .slice(-3);
      
      if (recentFailures.length >= 2) {
        newAlerts.push({
          id: `heartbeat-failure-${Date.now()}`,
          type: 'error',
          message: 'Multiple heartbeat failures detected. Please check your connection.',
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }
    
    setAlerts(newAlerts);
  }, [timeTracking.needsAttention, onlineStatus.connectionStatus, heartbeat.heartbeatData]);

  // Clear old alerts
  const clearOldAlerts = useCallback(() => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 1); // Remove alerts older than 1 hour
    
    setAlerts(prev => prev.filter(alert => alert.timestamp > cutoffTime));
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info': return '💡';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Real-Time Status</h3>
          <button
            onClick={() => setAlerts([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">📡</div>
              <div className="text-sm">No alerts at this time</div>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-start p-3 mb-3 rounded-lg border ${
                  alert.acknowledged 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex-shrink-0 mr-3">
                  <div className={`text-2xl ${getAlertIcon(alert.type)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div>
                    <div className={`font-medium ${getAlertColor(alert.type)}`}>
                      {alert.message}
                    </div>
                    <div className="text-sm text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}
    </div>
  );
}
