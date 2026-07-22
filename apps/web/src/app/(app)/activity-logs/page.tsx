'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export default function ActivityLogsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Fetch activity logs from backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await apiService.getActivityLogs();
        if (response.success && response.data) {
          setLogs(response.data);
        }
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [searchTerm]);

  const handleExportLogs = async () => {
    try {
      const response = await apiService.exportActivityLogs();
      if (response.success) {
        // Handle file download
        console.log('Logs exported successfully');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedSeverity === 'all') return true;
    return log.severity === selectedSeverity;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <SidebarHeader 
          collapsed={false}
          isOnline={true}
          notificationCount={0}
          onToggleCollapse={async () => {}}
          onRefreshNotifications={async () => {}}
        />
        <nav className="mt-8">
          <SidebarNav 
            collapsed={false}
            isTransitioning={false}
            isNavigating={false}
            indicatorY={0}
            onNavigationStart={async () => {}}
            onIndicatorChange={() => {}}
            containerRef={containerRef}
          />
        </nav>
        <SidebarFooter 
          collapsed={false}
          isOnline={true}
          isNavigating={false}
          onLogout={async () => {}}
          onNavigationStart={async () => {}}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="mt-2 text-gray-600">
                Monitor and track user activities across the platform
              </p>
            </div>

            {/* Activity Logs Content */}
            <Suspense fallback={<div>Loading activity logs...</div>}>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
                    <div className="flex space-x-3">
                      <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter activity logs by severity level"
                        title="Select severity level to filter activity logs"
                      >
                        <option value="all">All Levels</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                      <button 
                        onClick={handleExportLogs}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Export Logs
                      </button>
                    </div>
                  </div>
                  
                  {/* Activity List */}
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                log.severity === 'success' ? 'bg-green-500' :
                                log.severity === 'error' ? 'bg-red-500' :
                                log.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}></div>
                              <span className="text-sm font-medium text-gray-900">{log.action}</span>
                              <span className="text-xs text-gray-500 ml-2">{log.timestamp}</span>
                              <span className="text-xs text-gray-500 ml-2">by {log.userName}</span>
                            </div>
                            <p className="text-sm text-gray-600">{log.details}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Resource: {log.resource}</span>
                              <span>IP: {log.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
