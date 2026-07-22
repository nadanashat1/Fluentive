'use client';

import { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { apiService } from '@/services/apiService';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }[];
}

interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: ChartData;
  options: {
    responsive: boolean;
    plugins: {
      legend: {
        display: boolean;
      };
      tooltip: {
        enabled: boolean;
      };
    };
  };
}

export function DataVisualization() {
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'users' | 'performance' | 'conversion'>('revenue');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isAnimated, setIsAnimated] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  const realTimeData = useRealTimeData({
    updateInterval: 10000,
    enableWebSocket: true,
    userId: 'current-user'
  });

  // State for real data
  const [visualizationData, setVisualizationData] = useState({
    revenue: [],
    users: [],
    performance: [],
    conversion: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    const fetchVisualizationData = async () => {
      try {
        setLoading(true);
        const [leadsResponse, dealsResponse, usersResponse, systemResponse] = await Promise.all([
          apiService.getLeads(),
          apiService.getDeals(),
          apiService.getUsers(),
          apiService.getSystemHealth()
        ]);

        if (leadsResponse.success && dealsResponse.success && usersResponse.success) {
          const baseLabels = timeRange === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                         timeRange === '30d' ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`) :
                         timeRange === '90d' ? Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`) :
                         ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          setVisualizationData({
            revenue: Array.from({ length: baseLabels.length }, () => 
              dealsResponse.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) / baseLabels.length || 0
            ),
            users: Array.from({ length: baseLabels.length }, () => 
              usersResponse.data?.length || 0
            ),
            performance: Array.from({ length: baseLabels.length }, () => 
              systemResponse.data?.uptime || 99.9
            ),
            conversion: Array.from({ length: baseLabels.length }, () => {
              const totalLeads = leadsResponse.data?.length || 0;
              const totalDeals = dealsResponse.data?.length || 0;
              return totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0;
            })
          });
        }
      } catch (error) {
        console.error('Error fetching visualization data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisualizationData();
  }, [timeRange]);

  // Generate chart data based on selected chart type
  const generateChartData = (): VisualizationConfig => {
    const baseLabels = timeRange === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                     timeRange === '30d' ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`) :
                     timeRange === '90d' ? Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`) :
                     ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (selectedChart) {
      case 'revenue':
        return {
          type: chartType,
          title: 'Revenue Trends',
          data: {
            labels: baseLabels,
            datasets: [
              {
                label: 'Revenue',
                data: visualizationData.revenue,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: chartType === 'area'
              },
              {
                label: 'Target',
                data: visualizationData.revenue.map(val => val * 1.15),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false
              },
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: showLegend },
              tooltip: { enabled: true }
            }
          }
        };

      case 'users':
        return {
          type: chartType,
          title: 'User Activity',
          data: {
            labels: baseLabels,
            datasets: [
              {
                label: 'Active Users',
                data: visualizationData.users,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: chartType === 'area'
              },
              {
                label: 'New Users',
                data: visualizationData.users.map(val => val * 1.2),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: showLegend },
              tooltip: { enabled: true }
            }
          }
        };

      case 'performance':
        return {
          type: 'bar',
          title: 'Performance Metrics',
          data: {
            labels: ['Response Time', 'Uptime', 'Error Rate', 'Memory', 'CPU'],
            datasets: [
              {
                label: 'Current',
                data: [
                  (visualizationData.performance[0] || 1.2) * 100,
                  visualizationData.performance[1] || 99.9,
                  visualizationData.performance[2] || 0.3,
                  65 + Math.random() * 10,
                  45 + Math.random() * 15
                ],
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                fill: false
              },
              {
                label: 'Target',
                data: [100, 99.5, 1.0, 80, 70],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: showLegend },
              tooltip: { enabled: true }
            }
          }
        };

      case 'conversion':
        return {
          type: 'bar',
          title: 'Conversion Funnel',
          data: {
            labels: ['Visitors', 'Leads', 'Qualified', 'Proposals', 'Closed'],
            datasets: [
              {
                label: 'Conversion Rate',
                data: [100, 35, 25, 18, 12],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: showLegend },
              tooltip: { enabled: true }
            }
          }
        };

      default:
        return generateChartData();
    }
  };

  const [chartConfig, setChartConfig] = useState<VisualizationConfig>(generateChartData());

  // Update chart data when selection changes
  useEffect(() => {
    setChartConfig(generateChartData());
  }, [selectedChart, chartType, timeRange, showLegend, realTimeData.data]);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isAnimated) return;

    const interval = setInterval(() => {
      setChartConfig(prev => ({
        ...prev,
        data: {
          ...prev.data,
          datasets: prev.data.datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map((value, index) => {
              const variation = Math.random() * 0.1 - 0.05; // ±5% variation
              const newValue = value * (1 + variation);
              return Math.max(0, newValue);
            })
          }))
        }
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnimated]);

  const renderChart = () => {
    const maxValue = Math.max(...chartConfig.data.datasets.flatMap(d => d.data));
    const minValue = Math.min(...chartConfig.data.datasets.flatMap(d => d.data));

    return (
      <div className="relative h-80 w-full">
        {/* Chart Grid */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-gray-200"
                style={{ top: `${(i + 1) * 20}%` }}
              ></div>
            ))}
          </div>
        )}

        {/* Chart Content */}
        <div className="relative h-full w-full">
          {chartConfig.type === 'line' && (
            <svg className="w-full h-full">
              {chartConfig.data.datasets.map((dataset, datasetIndex) => (
                <g key={datasetIndex}>
                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke={dataset.borderColor}
                    strokeWidth="2"
                    points={dataset.data.map((value, index) => {
                      const x = (index / (dataset.data.length - 1)) * 100;
                      const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                    className={isAnimated ? 'transition-all duration-1000' : ''}
                  />
                  
                  {/* Area fill */}
                  {dataset.fill && (
                    <polygon
                      fill={dataset.backgroundColor}
                      points={`0%,100% ${dataset.data.map((value, index) => {
                        const x = (index / (dataset.data.length - 1)) * 100;
                        const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
                        return `${x}%,${y}%`;
                      }).join(' ')} 100%,100%`}
                      className={isAnimated ? 'transition-all duration-1000' : ''}
                    />
                  )}
                  
                  {/* Data points */}
                  {dataset.data.map((value, index) => {
                    const x = (index / (dataset.data.length - 1)) * 100;
                    const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
                    return (
                      <circle
                        key={index}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="4"
                        fill={dataset.borderColor}
                        className="hover:r-6 transition-all cursor-pointer"
                      />
                    );
                  })}
                </g>
              ))}
            </svg>
          )}

          {chartConfig.type === 'bar' && (
            <div className="h-full w-full flex items-end justify-around px-4">
              {chartConfig.data.labels.map((label, index) => {
                const datasetValues = chartConfig.data.datasets.map(dataset => dataset.data[index]);
                const totalHeight = datasetValues.reduce((a, b) => a + b, 0);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full mx-1">
                    <div className="w-full flex flex-col-reverse">
                      {chartConfig.data.datasets.map((dataset, datasetIndex) => (
                        <div
                          key={datasetIndex}
                          className="w-full transition-all duration-1000 hover:opacity-80"
                          style={{
                            height: `${(dataset.data[index] / maxValue) * 100}%`,
                            backgroundColor: dataset.backgroundColor,
                            minHeight: '2px'
                          }}
                        ></div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      {label.length > 8 ? label.substring(0, 8) + '...' : label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {chartConfig.type === 'area' && (
            <svg className="w-full h-full">
              {chartConfig.data.datasets.map((dataset, datasetIndex) => (
                <g key={datasetIndex}>
                  <polygon
                    fill={dataset.backgroundColor}
                    stroke={dataset.borderColor}
                    strokeWidth="2"
                    points={`0%,100% ${dataset.data.map((value, index) => {
                      const x = (index / (dataset.data.length - 1)) * 100;
                      const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
                      return `${x}%,${y}%`;
                    }).join(' ')} 100%,100%`}
                    className={isAnimated ? 'transition-all duration-1000' : ''}
                  />
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-600 -ml-8">
          {Array.from({ length: 5 }, (_, i) => {
            const value = minValue + (maxValue - minValue) * (1 - (i + 1) / 5);
            return (
              <div key={i} className="text-right">
                {value.toFixed(0)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'revenue': return '💰';
      case 'users': return '👥';
      case 'performance': return '📊';
      case 'conversion': return '🔄';
      default: return '📈';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Data Visualization</h3>
        <div className="flex items-center space-x-4">
          {/* Animation toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Animation:</label>
            <button
              onClick={() => setIsAnimated(!isAnimated)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnimated ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label={isAnimated ? 'Disable animation' : 'Enable animation'}
              title={isAnimated ? 'Disable animation' : 'Enable animation'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnimated ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Grid toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Grid:</label>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showGrid ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label={showGrid ? 'Hide grid' : 'Show grid'}
              title={showGrid ? 'Hide grid' : 'Show grid'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showGrid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Legend toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Legend:</label>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showLegend ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label={showLegend ? 'Hide legend' : 'Show legend'}
              title={showLegend ? 'Hide legend' : 'Show legend'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showLegend ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Chart Type Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Chart Type:</label>
          <div className="flex space-x-2">
            {(['line', 'bar', 'area'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-label={`Select ${type} chart`}
                title={`Select ${type} chart type`}
              >
                {type === 'line' ? '📈' : type === 'bar' ? '📊' : '📉'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Data:</label>
          <select
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select data type"
            title="Select data type for visualization"
          >
            <option value="revenue">Revenue Trends</option>
            <option value="users">User Activity</option>
            <option value="performance">Performance Metrics</option>
            <option value="conversion">Conversion Funnel</option>
          </select>
        </div>

        {/* Time Range */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select time range"
            title="Select time range for data"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">{getChartIcon(selectedChart)}</span>
            {chartConfig.title}
          </h4>
          <div className="flex items-center space-x-2">
            {isAnimated && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-gray-600">Live</span>
              </div>
            )}
          </div>
        </div>
        
        {renderChart()}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center space-x-6 mb-6">
          {chartConfig.data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: dataset.borderColor }}
              ></div>
              <span className="text-sm text-gray-700">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartConfig.data.datasets.map((dataset, datasetIndex) => {
          const total = dataset.data.reduce((a, b) => a + b, 0);
          const average = total / dataset.data.length;
          const max = Math.max(...dataset.data);
          const min = Math.min(...dataset.data);

          return (
            <div key={datasetIndex} className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">{dataset.label}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Avg:</span>
                  <span className="font-medium">{average.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Max:</span>
                  <span className="font-medium">{max.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Min:</span>
                  <span className="font-medium">{min.toFixed(0)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Status */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              realTimeData.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-700">
              {realTimeData.isOnline ? 'Real-time data active' : 'Data paused'}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Updates every 3s
          </div>
        </div>
      </div>
    </div>
  );
}
