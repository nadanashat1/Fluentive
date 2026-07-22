'use client';

import { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { apiService } from '@/services/apiService';

export function AdvancedAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'deals' | 'conversion'>('revenue');
  const [comparison, setComparison] = useState<'previous' | 'target'>('previous');
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalDeals: 0,
    conversionRate: 0,
    previousRevenue: 0,
    previousUsers: 0,
    previousDeals: 0,
    previousConversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  const realTimeData = useRealTimeData({
    updateInterval: 10000,
    enableWebSocket: true,
    userId: 'current-user'
  });

  // Fetch real analytics data from backend
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [leadsResponse, dealsResponse, usersResponse] = await Promise.all([
          apiService.getLeads(),
          apiService.getDeals(),
          apiService.getUsers()
        ]);

        if (leadsResponse.success && dealsResponse.success && usersResponse.success) {
          const totalRevenue = dealsResponse.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
          const totalUsers = usersResponse.data?.length || 0;
          const totalDeals = dealsResponse.data?.length || 0;
          const totalLeads = leadsResponse.data?.length || 0;
          const conversionRate = totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0;

          setAnalyticsData({
            totalRevenue,
            totalUsers,
            totalDeals,
            conversionRate,
            previousRevenue: totalRevenue * 0.92, // Simulate 8% growth
            previousUsers: totalUsers * 0.85, // Simulate 15% growth
            previousDeals: totalDeals * 0.9, // Simulate 10% growth
            previousConversionRate: conversionRate * 0.95 // Simulate 5% improvement
          });
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Simulate trend calculation
  const calculateTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const getComparisonData = () => {
    let current = 0;
    let previous = 0;
    let target = 0;
    
    switch (selectedMetric) {
      case 'revenue':
        current = analyticsData.totalRevenue;
        previous = analyticsData.previousRevenue;
        target = current * 1.15; // 15% target
        break;
      case 'users':
        current = analyticsData.totalUsers;
        previous = analyticsData.previousUsers;
        target = current * 1.20; // 20% target
        break;
      case 'deals':
        current = analyticsData.totalDeals;
        previous = analyticsData.previousDeals;
        target = current * 1.10; // 10% target
        break;
      case 'conversion':
        current = analyticsData.conversionRate;
        previous = analyticsData.previousConversionRate;
        target = Math.min(current * 1.25, 100); // 25% target, max 100%
        break;
    }
    
    switch (comparison) {
      case 'previous':
        return { value: previous, label: 'Previous Period' };
      case 'target':
        return { value: target, label: 'Target Goal' };
      default:
        return { value: current, label: 'Current' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Advanced Analytics</h3>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select time range"
              title="Select time range for analytics"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select metric"
              title="Select metric for analytics"
            >
              <option value="revenue">Revenue</option>
              <option value="users">Users</option>
              <option value="deals">Deals</option>
              <option value="conversion">Conversion Rate</option>
            </select>
          </div>

          {/* Comparison Mode */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Compare:</label>
            <select
              value={comparison}
              onChange={(e) => setComparison(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select comparison mode"
              title="Select comparison mode for analytics"
            >
              <option value="previous">Previous Period</option>
              <option value="target">Target Goal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedMetric === 'revenue' && 'Revenue Analytics'}
            {selectedMetric === 'users' && 'User Analytics'}
            {selectedMetric === 'deals' && 'Deal Analytics'}
            {selectedMetric === 'conversion' && 'Conversion Analytics'}
          </h4>
          
          {/* Metric Display */}
          <div className="space-y-6">
            {selectedMetric === 'revenue' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatCurrency(realTimeData.data.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className={`text-lg font-medium ${getTrendColor(calculateTrend(realTimeData.data.totalRevenue, realTimeData.data.totalRevenue * 0.92))}`}>
                      {getTrendIcon(calculateTrend(realTimeData.data.totalRevenue, realTimeData.data.totalRevenue * 0.92))}
                      <span className="ml-2">
                        {formatPercentage(Math.abs((realTimeData.data.totalRevenue - (realTimeData.data.totalRevenue * 0.92)) / (realTimeData.data.totalRevenue * 0.92) * 100))}
                        {calculateTrend(realTimeData.data.totalRevenue, realTimeData.data.totalRevenue * 0.92) === 'up' ? 'vs previous' : 'vs target'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(realTimeData.data.newLeads * 2500)}
                    </div>
                    <div className="text-sm text-gray-600">Lead Value</div>
                    <div className="text-lg font-medium text-green-600">
                      +{formatPercentage(((realTimeData.data.newLeads * 2500 - (realTimeData.data.newLeads * 2500 * 0.85)) / (realTimeData.data.newLeads * 2500 * 0.85) * 100))}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {realTimeData.data.activeDeals}
                    </div>
                    <div className="text-sm text-gray-600">Active Deals</div>
                    <div className="text-lg font-medium text-purple-600">
                      +{formatPercentage(((realTimeData.data.activeDeals - 70) / 70 * 100))}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'users' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {realTimeData.data.activeUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Active Users Now</div>
                    <div className="text-lg font-medium text-blue-600">
                      +{formatPercentage(((realTimeData.data.activeUsers - 1100) / 1100 * 100))}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {Math.floor(realTimeData.data.activeUsers * 0.75).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Daily Active Users</div>
                    <div className="text-lg font-medium text-green-600">
                      +{formatPercentage(((Math.floor(realTimeData.data.activeUsers * 0.75) - 800) / 800 * 100))}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'deals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {realTimeData.data.newLeads}
                    </div>
                    <div className="text-sm text-gray-600">New Leads</div>
                    <div className="text-lg font-medium text-green-600">
                      +{formatPercentage(((realTimeData.data.newLeads - 300) / 300 * 100))}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.floor(realTimeData.data.newLeads * 0.35)}
                    </div>
                    <div className="text-sm text-gray-600">Qualified Leads</div>
                    <div className="text-lg font-medium text-blue-600">
                      {formatPercentage((Math.floor(realTimeData.data.newLeads * 0.35) / (realTimeData.data.newLeads * 0.35)) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'conversion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatPercentage(23.5)}
                    </div>
                    <div className="text-sm text-gray-600">Overall Conversion Rate</div>
                    <div className="text-lg font-medium text-green-600">
                      Above Target
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatPercentage(18.2)}
                    </div>
                    <div className="text-sm text-gray-600">Lead to Deal Rate</div>
                    <div className="text-lg font-medium text-blue-600">
                      Improving
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Panel */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{getComparisonData().label}</span>
              <span className="text-2xl font-bold text-gray-900">
                {selectedMetric === 'revenue' && formatCurrency(getComparisonData().value)}
                {selectedMetric === 'users' && getComparisonData().value.toLocaleString()}
                {selectedMetric === 'deals' && getComparisonData().value}
                {selectedMetric === 'conversion' && formatPercentage(getComparisonData().value)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Current</span>
              <span className="text-2xl font-bold text-blue-600">
                {selectedMetric === 'revenue' && formatCurrency(realTimeData.data.totalRevenue)}
                {selectedMetric === 'users' && getComparisonData().value.toLocaleString()}
                {selectedMetric === 'deals' && realTimeData.data.activeDeals}
                {selectedMetric === 'conversion' && formatPercentage(23.5)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Target</span>
              <span className="text-2xl font-bold text-green-600">
                {selectedMetric === 'revenue' && formatCurrency(realTimeData.data.totalRevenue * 1.15)}
                {selectedMetric === 'users' && Math.floor(realTimeData.data.activeUsers * 1.2).toLocaleString()}
                {selectedMetric === 'deals' && Math.floor(realTimeData.data.activeDeals * 1.25)}
                {selectedMetric === 'conversion' && formatPercentage(25.0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Updates Indicator */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${realTimeData.isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {realTimeData.isOnline ? 'Live Updates Active' : 'Live Updates Paused'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Last update: {realTimeData.dataAge}s ago
          </div>
        </div>
      </div>
    </div>
  );
}
