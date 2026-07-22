'use client';

import { useState, useEffect } from 'react';
import { useUserPresence } from '@/hooks/useUserPresence';
import { apiService } from '@/services/apiService';

export function PresenceDashboard() {
  const [presenceData, setPresenceData] = useState({
    onlineUsers: [],
    recentActivity: [],
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  const presence = useUserPresence({
    userId: 'current-user',
    heartbeatInterval: 30000,
    idleTimeout: 300000,
    autoStart: true
  });

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'away': return 'text-orange-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'online': return '🟢';
      case 'idle': return '🟡';
      case 'away': return '🟠';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  // Fetch real presence data from API
  useEffect(() => {
    const fetchPresenceData = async () => {
      try {
        setLoading(true);
        const [usersResponse, activitiesResponse] = await Promise.all([
          apiService.getUsers(),
          apiService.getActivityLogs()
        ]);

        if (usersResponse.success && activitiesResponse.success) {
          const onlineUsers = usersResponse.data?.filter(user => {
            const lastSeen = new Date(user.lastSeen);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastSeen > fiveMinutesAgo;
          }) || [];

          const recentActivity = activitiesResponse.data?.slice(0, 5) || [];

          setPresenceData({
            onlineUsers,
            recentActivity,
            totalUsers: usersResponse.data?.length || 0
          });
        }
      } catch (error) {
        console.error('Error fetching presence data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresenceData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Presence</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(presence.status)}`}></div>
            <span className="font-medium text-gray-700">
              {presence.status.charAt(0).toUpperCase() + presence.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              {getStatusIcon(presence.status)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last seen: {presence.lastSeen.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={presence.isTracking ? presence.stopTracking : presence.startTracking}
            className={`px-4 py-2 rounded-lg font-medium ${
              presence.isTracking 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {presence.isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
          
          <button
            onClick={presence.handleUserActivity}
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            Log Activity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatTime(presence.totalTimeToday)}
            </div>
            <div className="text-sm text-gray-600">Total Time Today</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatTime(presence.sessionDuration)}
            </div>
            <div className="text-sm text-gray-600">Current Session</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${getStatusColor(presence.status)}`}>
              {presence.lastSeen.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-600">Last Activity</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">User ID:</span>
            <span className="text-sm font-medium text-gray-900">{presence.userId}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${getStatusColor(presence.status)}`}>
              {presence.status.charAt(0).toUpperCase() + presence.status.slice(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Heartbeat:</span>
            <span className="text-sm font-medium text-gray-900">
              {presence.lastHeartbeat.toLocaleTimeString()}
            </span>
          </div>
          
          {presence.activeSessionStart && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Session Started:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(presence.activeSessionStart).toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Is Tracking:</span>
            <span className={`text-sm font-medium ${presence.isTracking ? 'text-green-600' : 'text-gray-600'}`}>
              {presence.isTracking ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Activity logged at {new Date().toLocaleTimeString()}</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex justify-between">
            <span>Heartbeat sent at {presence.lastHeartbeat.toLocaleTimeString()}</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex justify-between">
            <span>Status updated to {presence.status} at {presence.lastSeen.toLocaleTimeString()}</span>
            <span className="text-green-600">✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
