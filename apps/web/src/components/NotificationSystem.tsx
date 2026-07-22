'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useHeartbeat } from '@/hooks/useHeartbeat';

interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
  actionUrl?: string;
  actionText?: string;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
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

  // Auto-generate notifications based on system status
  useEffect(() => {
    const newNotifications = [];
    
    // Time tracking notifications
    if (timeTracking.needsAttention) {
      newNotifications.push({
        id: `idle-warning-${Date.now()}`,
        type: 'warning',
        title: 'Inactivity Warning',
        message: 'You have been inactive for a while. Consider taking a break or logging your current activity.',
        timestamp: new Date(),
        autoHide: false
      });
    }
    
    // Connection status notifications
    if (onlineStatus.connectionStatus === 'disconnected') {
      newNotifications.push({
        id: `connection-lost-${Date.now()}`,
        type: 'error',
        title: 'Connection Lost',
        message: 'Connection to server lost. Attempting to reconnect...',
        timestamp: new Date(),
        autoHide: false,
        actionUrl: '/settings',
        actionText: 'Check Connection Settings'
      });
    }
    
    // Heartbeat failure notifications
    if (heartbeat.heartbeatData.length > 0) {
      const recentFailures = heartbeat.heartbeatData
        .filter(h => h.status === 'error')
        .slice(-3);
      
      if (recentFailures.length >= 2) {
        newNotifications.push({
          id: `heartbeat-failure-${Date.now()}`,
          type: 'error',
          title: 'Multiple Heartbeat Failures',
          message: 'Multiple heartbeat failures detected. Please check your connection.',
          timestamp: new Date(),
          autoHide: false
        });
      }
    }
    
    // Success notifications (time tracking milestones)
    const todayTotalMinutes = timeTracking.totalTimeToday;
    if (todayTotalMinutes >= 480 && todayTotalMinutes % 480 === 0) {
      newNotifications.push({
        id: `milestone-${Date.now()}`,
        type: 'success',
        title: 'Daily Goal Achieved!',
        message: `Congratulations! You've tracked ${Math.floor(todayTotalMinutes / 60)} hours today.`,
        timestamp: new Date(),
        autoHide: false
      });
    }
    
    // Update unread count
    const newUnreadCount = newNotifications.filter(n => !n.acknowledged).length;
    setUnreadCount(newUnreadCount);
    setNotifications(prev => [...prev, ...newNotifications]);
  }, [timeTracking.needsAttention, onlineStatus.connectionStatus, heartbeat.heartbeatData, timeTracking.totalTimeToday]);

  // Handle notification actions
  const handleNotificationAction = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, acknowledged: true } : n
    ));
  }, []);

  // Clear notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Auto-hide notifications after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => prev.map(n => ({ ...n, autoHide: true })));
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
              unreadCount > 0 ? 'bg-red-500' : 'bg-gray-300'
            }`}>
              {unreadCount}
            </span>
            <button
              onClick={clearAllNotifications}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🔔</div>
            <div className="text-sm">No notifications at this time</div>
          </div>
        ) : (
          notifications.slice().reverse().map(notification => (
            <div
              key={notification.id}
              className={`p-4 mb-3 rounded-lg border ${
                notification.autoHide ? 'opacity-50' : 'opacity-100'
              } ${
                notification.type === 'error' ? 'border-red-200' :
                notification.type === 'warning' ? 'border-yellow-200' :
                notification.type === 'success' ? 'border-green-200' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    notification.type === 'success' ? 'bg-green-500' :
                    'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <div>
                      <div className="font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-600">{notification.message}</div>
                      <div className="text-xs text-gray-500">{notification.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!notification.acknowledged && (
                    <button
                      onClick={() => handleNotificationAction(notification.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {notification.actionText || 'Acknowledge'}
                    </button>
                  )}
                  
                  {notification.actionUrl && (
                    <button
                      onClick={() => window.open(notification.actionUrl!, '_blank')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {notification.actionUrl?.replace(/^(https?:\/\/)/, '') || 'View Details'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
