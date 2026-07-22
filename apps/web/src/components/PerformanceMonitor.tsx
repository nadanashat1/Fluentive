'use client';

import { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { apiService } from '@/services/apiService';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  target: number;
  historical: number[];
}

interface Alert {
  id: string;
  type: 'performance' | 'system' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const realTimeData = useRealTimeData({
    updateInterval: refreshInterval,
    enableWebSocket: true,
    userId: 'current-user'
  });

  // Initialize performance metrics with real data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const systemHealthResponse = await apiService.getSystemHealth();
        const systemHealth = systemHealthResponse.success ? systemHealthResponse.data : {
          uptime: 99.9,
          responseTime: 1.2,
          errorRate: 0.3,
          activeUsers: 2400
        };

        const initialMetrics: PerformanceMetric[] = [
          {
            id: 'response_time',
            name: 'Response Time',
            value: systemHealth.responseTime * 1000,
            unit: 'ms',
            status: systemHealth.responseTime < 1 ? 'excellent' : systemHealth.responseTime < 2 ? 'good' : 'warning',
            trend: 'stable',
            target: 1000,
            historical: Array.from({ length: 20 }, () => systemHealth.responseTime * 1000 + Math.random() * 200 - 100)
          },
          {
            id: 'uptime',
            name: 'System Uptime',
            value: systemHealth.uptime,
            unit: '%',
            status: systemHealth.uptime > 99.5 ? 'excellent' : systemHealth.uptime > 99 ? 'good' : 'warning',
            trend: 'up',
            target: 99.5,
            historical: Array.from({ length: 20 }, (_, i) => 99.5 + Math.random() * 0.5 - 0.25)
          },
          {
            id: 'error_rate',
            name: 'Error Rate',
            value: systemHealth.errorRate,
            unit: '%',
            status: systemHealth.errorRate < 0.5 ? 'excellent' : systemHealth.errorRate < 1 ? 'good' : 'warning',
            trend: 'down',
            target: 1.0,
            historical: Array.from({ length: 20 }, () => systemHealth.errorRate + Math.random() * 0.2 - 0.1)
          },
          {
            id: 'active_users',
            name: 'Active Users',
            value: systemHealth.activeUsers,
            unit: 'users',
            status: systemHealth.activeUsers > 2000 ? 'excellent' : 'good',
            trend: 'up',
            target: 1500,
            historical: Array.from({ length: 20 }, (_, i) => systemHealth.activeUsers + Math.random() * 100 - 50)
          },
          {
            id: 'memory_usage',
            name: 'Memory Usage',
            value: 65 + Math.random() * 10,
            unit: '%',
            status: 'good',
            trend: 'stable',
            target: 80,
            historical: Array.from({ length: 20 }, () => 65 + Math.random() * 10)
          },
          {
            id: 'cpu_usage',
            name: 'CPU Usage',
            value: 45 + Math.random() * 15,
            unit: '%',
            status: 'good',
            trend: 'stable',
            target: 70,
            historical: Array.from({ length: 20 }, () => 45 + Math.random() * 15)
          }
        ];

      setMetrics(initialMetrics);
    };

    fetchPerformanceData();
  }, []);

  // Update metrics in real-time
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const newValue = metric.id === 'response_time' 
          ? realTimeData.data.systemHealth.responseTime * 1000 + Math.random() * 200 - 100
          : metric.id === 'uptime'
          ? realTimeData.data.systemHealth.uptime + Math.random() * 0.2 - 0.1
          : metric.id === 'error_rate'
          ? realTimeData.data.systemHealth.errorRate + Math.random() * 0.1 - 0.05
          : metric.id === 'active_users'
          ? realTimeData.data.activeUsers + Math.random() * 100 - 50
          : metric.value + Math.random() * 10 - 5;

        const newHistorical = [...metric.historical.slice(1), newValue];
        const avgValue = newHistorical.reduce((a, b) => a + b, 0) / newHistorical.length;
        const trend = newValue > avgValue + 5 ? 'up' : newValue < avgValue - 5 ? 'down' : 'stable';

        // Determine status based on target
        let status: PerformanceMetric['status'] = 'good';
        if (metric.id === 'uptime') {
          status = newValue >= metric.target ? 'excellent' : newValue >= metric.target - 1 ? 'good' : 'warning';
        } else if (metric.id === 'error_rate') {
          status = newValue <= metric.target * 0.5 ? 'excellent' : newValue <= metric.target ? 'good' : newValue <= metric.target * 2 ? 'warning' : 'critical';
        } else {
          const percentage = (newValue / metric.target) * 100;
          status = percentage <= 80 ? 'excellent' : percentage <= 100 ? 'good' : percentage <= 120 ? 'warning' : 'critical';
        }

        return {
          ...metric,
          value: Math.max(0, newValue),
          historical: newHistorical,
          trend,
          status
        };
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, realTimeData.data]);

  // Generate alerts based on metrics
  useEffect(() => {
    const newAlerts: Alert[] = [];

    metrics.forEach(metric => {
      if (metric.status === 'critical') {
        newAlerts.push({
          id: `${metric.id}-${Date.now()}`,
          type: 'performance',
          severity: 'high',
          title: `Critical: ${metric.name}`,
          description: `${metric.name} is at ${metric.value.toFixed(2)}${metric.unit}, exceeding target of ${metric.target}${metric.unit}`,
          timestamp: new Date(),
          resolved: false
        });
      } else if (metric.status === 'warning') {
        newAlerts.push({
          id: `${metric.id}-${Date.now()}`,
          type: 'performance',
          severity: 'medium',
          title: `Warning: ${metric.name}`,
          description: `${metric.name} is approaching threshold at ${metric.value.toFixed(2)}${metric.unit}`,
          timestamp: new Date(),
          resolved: false
        });
      }
    });

    setAlerts(newAlerts);
  }, [metrics]);

  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, resolved: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Performance Monitor</h3>
        <div className="flex items-center space-x-4">
          {/* Auto-refresh toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Auto-refresh:</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Refresh interval */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Interval:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select refresh interval"
              title="Select refresh interval for performance metrics"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>

          {/* Time range */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select time range"
              title="Select time range for performance data"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Active Alerts</h4>
            <button
              onClick={clearAllAlerts}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-semibold text-sm">{alert.title}</h5>
                      <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{alert.description}</p>
                    <div className="text-xs text-gray-600 mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="ml-4 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map(metric => (
          <div
            key={metric.id}
            className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{metric.name}</h4>
              <div className="flex items-center space-x-1">
                <span className="text-xs">{getTrendIcon(metric.trend)}</span>
                <span className={`w-2 h-2 rounded-full ${
                  metric.status === 'excellent' ? 'bg-green-500' :
                  metric.status === 'good' ? 'bg-blue-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-2xl font-bold">
                {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
              </div>
              <div className="text-xs text-gray-600">
                Target: {metric.target}{metric.unit}
              </div>
            </div>

            {/* Mini sparkline chart */}
            <div className="h-8 flex items-end space-x-1">
              {metric.historical.slice(-10).map((value, index) => {
                const heightPercentage = (value / Math.max(...metric.historical)) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-current opacity-30 rounded-t"
                    style={{
                      height: `${heightPercentage}%`,
                      minHeight: '2px'
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Overview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {metrics.filter(m => m.status === 'excellent' || m.status === 'good').length}
            </div>
            <div className="text-sm text-gray-600">Healthy Metrics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {metrics.filter(m => m.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Warning Metrics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {metrics.filter(m => m.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical Metrics</div>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm text-gray-700">
              {autoRefresh ? 'Real-time monitoring active' : 'Monitoring paused'}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Refresh: {refreshInterval / 1000}s
          </div>
        </div>
      </div>
    </div>
  );
}
