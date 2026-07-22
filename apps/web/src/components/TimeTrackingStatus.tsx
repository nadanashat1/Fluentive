'use client';

import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useHeartbeat } from '@/hooks/useHeartbeat';

export function TimeTrackingStatus() {
  const timeTracking = useTimeTracking({
    autoStart: true,
    idleTimeout: 15, // 15 minutes
    notificationThreshold: 480 // 8 hours
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

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Time Tracking Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${timeTracking.isTracking ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">
            {timeTracking.isTracking ? 'Tracking' : 'Paused'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatTime(timeTracking.totalTimeToday)}
            </div>
            <div className="text-sm text-gray-600">Total Time Today</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatTime(timeTracking.currentSessionDuration)}
            </div>
            <div className="text-sm text-gray-600">Current Session</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getStatusColor(heartbeat.heartbeatData[heartbeat.heartbeatData.length - 1]?.status || 'online'}`}>
              {heartbeat.lastHeartbeat.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-600">Last Heartbeat</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getStatusColor(onlineStatus.currentStatus?.status || 'online')}`}>
              {onlineStatus.isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="text-sm text-gray-600">Connection Status</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getQualityColor(onlineStatus.connectionQuality)}`}>
              {onlineStatus.connectionQuality || 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">Connection Quality</div>
          </div>
        </div>
      </div>

      {/* Time Tracking Controls */}
      <div className="flex space-x-2">
        <button
          onClick={timeTracking.isTracking ? timeTracking.pauseTracking : timeTracking.startTracking}
          className={`px-4 py-2 rounded-lg font-medium ${
            timeTracking.isTracking 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {timeTracking.isTracking ? 'Pause Tracking' : 'Start Tracking'}
        </button>
        
        <button
          onClick={() => timeTracking.logActivity('Manual activity logged')}
          className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
        >
          Log Activity
        </button>
      </div>

      {/* Warnings */}
      {timeTracking.needsAttention && (
        <div className="bg-yellow-50 border border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full mr-3"></div>
            <div>
              <div className="text-yellow-800 font-medium">Attention Needed</div>
              <div className="text-sm text-yellow-700">
                You've been inactive for a while. Consider taking a break or logging your current activity.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Details */}
      {onlineStatus.reconnectAttempts > 0 && (
        <div className="bg-orange-50 border border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-500 rounded-full mr-3"></div>
            <div>
              <div className="text-orange-800 font-medium">Connection Issues</div>
              <div className="text-sm text-orange-700">
                Attempting to reconnect... ({onlineStatus.reconnectAttempts}/{onlineStatus.maxReconnectAttempts})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
