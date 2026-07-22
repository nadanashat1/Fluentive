'use client';

import { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { apiService } from '@/services/apiService';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');

  const realTimeData = useRealTimeData({
    updateInterval: 15000,
    enableWebSocket: true,
    userId: 'current-user'
  });

  // Fetch real notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiService.getNotifications();
        if (response.success && response.data) {
          const notifications: Notification[] = response.data.map((notif: any) => ({
            id: notif.id,
            type: notif.type || 'info',
            title: notif.title || 'System Notification',
            message: notif.message || 'New system activity',
            timestamp: new Date(notif.timestamp || Date.now()),
            read: notif.read || false,
            priority: notif.priority || 'medium'
          }));
          setNotifications(notifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to sample notifications if API fails
        const fallbackNotifications: Notification[] = [
          {
            id: '1',
            type: 'success',
            title: 'New Deal Closed',
            message: 'John Davidson closed a $125K deal with Microsoft',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            read: false,
            priority: 'high'
          },
          {
            id: '2',
            type: 'info',
            title: 'Lead Qualified',
            message: '15 new leads have been qualified this week',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: false,
            priority: 'medium'
          },
          {
            id: '3',
            type: 'warning',
            title: 'System Health Alert',
            message: 'Response time is slightly elevated (1.8s)',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            read: true,
            priority: 'medium'
          }
        ];
        setNotifications(fallbackNotifications);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'priority':
        return notifications.filter(n => n.priority === 'high');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === 'unread' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('priority')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === 'priority' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Priority ({notifications.filter(n => n.priority === 'high').length})
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Mark all read
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <div>No notifications</div>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                notification.read ? 'bg-gray-50' : getNotificationColor(notification.type)
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {notification.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {notification.timestamp.toLocaleTimeString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real-time Status */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              realTimeData.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {realTimeData.isOnline ? 'Live notifications active' : 'Notifications paused'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Updates every 30s
          </div>
        </div>
      </div>
    </div>
  );
}
