"use client";

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { authenticatedFetch } from '@/lib/api/auth-interceptor';
import { ROUTES } from '@/lib/api-endpoints';
import { Monitor, Smartphone, Globe, Clock, Trash2, Shield, UserX } from 'lucide-react';

interface Session {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  device: string;
  userAgent: string;
  ip: string;
  lastActivity: string;
  isActive: boolean;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with real API call
      const mockSessions: Session[] = [
        {
          id: '1',
          userId: 'user_1',
          user: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          device: 'Chrome 120 / Windows 10',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.100',
          lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          userId: 'user_2',
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          device: 'Safari 16 / iPhone 14',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
          ip: '192.168.1.101',
          lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          userId: 'user_3',
          user: {
            name: 'Bob Johnson',
            email: 'bob@example.com'
          },
          device: 'Firefox 115 / macOS',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
          ip: '192.168.1.102',
          lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isActive: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      setSessions(mockSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authenticatedFetch(`${ROUTES.users.list}/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      // Remove session from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return '🌐';
    if (userAgent.includes('Safari')) return '🍎';
    if (userAgent.includes('Firefox')) return '🦊';
    if (userAgent.includes('iPhone')) return '📱';
    return '💻';
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Session Monitor</h1>
          </div>
          
          {/* Skeleton loading */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-100">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Monitor</h1>
            <p className="text-gray-600">Active user sessions and device tracking</p>
          </div>
          <button
            onClick={fetchSessions}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Sessions Grid */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className={`${session.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {session.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                          <div className="text-sm text-gray-500">{session.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{getDeviceIcon(session.userAgent)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{session.device}</div>
                          <div className="text-xs text-gray-500 truncate max-w-32">{session.userAgent}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{session.ip}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatLastActivity(session.lastActivity)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {session.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="p-1 text-red-600 hover:text-red-900 disabled:opacity-50"
                          disabled={!session.isActive}
                          title={session.isActive ? 'Revoke session' : 'Session already inactive'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Session Stats */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{sessions.filter(s => s.isActive).length}</span> active sessions
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">{sessions.length}</span> total sessions
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
