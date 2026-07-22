'use client';

import { useState, useEffect } from 'react';
import { useUserPresence } from '@/hooks/useUserPresence';
import { apiService } from '@/services/apiService';

export function RealTimeDashboard() {
  const [realTimeData, setRealTimeData] = useState({
    totalRevenue: 0,
    newLeads: 0,
    activeDeals: 0,
    activeUsers: 0,
    systemHealth: {
      uptime: 0,
      responseTime: 0,
      errorRate: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const presence = useUserPresence({
    userId: 'current-user',
    heartbeatInterval: 30000,
    autoStart: true
  });

  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'deals' | 'health'>('revenue');

  // Fetch real-time data from API
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        setLoading(true);
        const [leadsResponse, dealsResponse, usersResponse, systemResponse] = await Promise.all([
          apiService.getLeads(),
          apiService.getDeals(),
          apiService.getUsers(),
          apiService.getSystemHealth()
        ]);

        if (leadsResponse.success && dealsResponse.success && usersResponse.success) {
          setRealTimeData({
            totalRevenue: dealsResponse.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0,
            newLeads: leadsResponse.data?.length || 0,
            activeDeals: dealsResponse.data?.filter(deal => deal.status === 'active').length || 0,
            activeUsers: usersResponse.data?.length || 0,
            systemHealth: systemResponse.data || {
              uptime: 99.9,
              responseTime: 1.2,
              errorRate: 0.3
            }
          });
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'revenue': return '💰';
      case 'users': return '👥';
      case 'deals': return '🤝';
      case 'health': return '💚';
      default: return '📊';
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'revenue': return 'text-green-600';
      case 'users': return 'text-blue-600';
      case 'deals': return 'text-purple-600';
      case 'health': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Real-Time Dashboard</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${realTimeData.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {realTimeData.isOnline ? 'Connected' : 'Disconnected'} • Last update: {realTimeData.dataAge}s ago
          </span>
          <button
            onClick={realTimeData.refreshData}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex space-x-2 mb-6">
        {(['revenue', 'users', 'deals', 'health'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMetric === metric
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="mr-2">{getMetricIcon(metric)}</span>
            <span className="capitalize">{metric}</span>
          </button>
        ))}
      </div>

      {/* Real-time Metrics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedMetric === 'revenue' && 'Revenue Metrics'}
            {selectedMetric === 'users' && 'User Activity'}
            {selectedMetric === 'deals' && 'Deal Pipeline'}
            {selectedMetric === 'health' && 'System Health'}
          </h4>
          
          {selectedMetric === 'revenue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(realTimeData.data.totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="text-green-600 text-sm font-medium">+12.5%</div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(realTimeData.data.newLeads * 2500)}</div>
                  <div className="text-sm text-gray-600">New Leads Value</div>
                </div>
                <div className="text-blue-600 text-sm font-medium">+8.3%</div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(realTimeData.data.activeDeals)}</div>
                  <div className="text-sm text-gray-600">Active Deals</div>
                </div>
                <div className="text-purple-600 text-sm font-medium">+5.2%</div>
              </div>
            </div>
          )}

          {selectedMetric === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(realTimeData.data.activeUsers)}</div>
                  <div className="text-sm text-gray-600">Active Now</div>
                </div>
                <div className="flex items-center">
                  <div className="text-green-600 text-sm">↑ 15%</div>
                  <span className="text-gray-600 ml-2">from yesterday</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatNumber(892)}</div>
                  <div className="text-sm text-gray-600">Daily Active</div>
                </div>
                <div className="flex items-center">
                  <div className="text-green-600 text-sm">↑ 8.1%</div>
                  <span className="text-gray-600 ml-2">vs last week</span>
                </div>
              </div>
            </div>
          )}

          {selectedMetric === 'deals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{formatNumber(24)}</div>
                  <div className="text-sm text-gray-600">New This Week</div>
                </div>
                <div className="text-yellow-600 text-sm font-medium">+18.5%</div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatNumber(18)}</div>
                  <div className="text-sm text-gray-600">Qualified</div>
                </div>
                <div className="text-green-600 text-sm font-medium">+12.3%</div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(12)}</div>
                  <div className="text-sm text-gray-600">Proposal</div>
                </div>
                <div className="text-blue-600 text-sm font-medium">+8.7%</div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(8)}</div>
                  <div className="text-sm text-gray-600">Closing</div>
                </div>
                <div className="text-purple-600 text-sm font-medium">+15.2%</div>
              </div>
            </div>
          )}

          {selectedMetric === 'health' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">{realTimeData.data.systemHealth.uptime}%</div>
                  <div className="text-sm text-gray-600">System Uptime</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full w-[99.9%]"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{realTimeData.data.systemHealth.responseTime}s</div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
                <div className="text-blue-600 text-sm font-medium">
                  {realTimeData.data.systemHealth.responseTime < 1 ? 'Excellent' : 'Good'}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{realTimeData.data.systemHealth.errorRate}%</div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                </div>
                <div className="text-yellow-600 text-sm font-medium">
                  {realTimeData.data.systemHealth.errorRate < 1 ? 'Excellent' : 'Good'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Activity Feed</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {realTimeData.data.teamActivity.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📭</div>
                <div>No recent activity</div>
              </div>
            ) : (
              realTimeData.data.teamActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                    activity.status === 'completed' ? 'bg-green-50' :
                    activity.status === 'in-progress' ? 'bg-yellow-50' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      activity.status === 'completed' ? 'bg-green-500' :
                      activity.status === 'in-progress' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.name}</div>
                      <div className="text-sm text-gray-600">{activity.action}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              presence.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Presence Status: <span className={presence.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {presence.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Session: {presence.sessionDuration.toFixed(1)}m • Total: {presence.totalTimeToday.toFixed(1)}m
              </div>
            </div>
          </div>
          <button
            onClick={presence.startTracking}
            disabled={presence.isTracking}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              presence.isTracking 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {presence.isTracking ? 'Tracking Active' : 'Start Tracking'}
          </button>
        </div>
      </div>
    </div>
  );
}
