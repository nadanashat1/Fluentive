"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
// Socket.io removed - using polling only for Vercel compatibility
import { motion } from 'framer-motion';
import { Users, Shield, Briefcase, User, Clock, Activity, MoreVertical } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastHeartbeat: string;
  isActive: boolean;
  isIdle: boolean;
}

type ActiveUserApiRecord = Partial<ActiveUser> & {
  userId?: string;
  user?: Partial<ActiveUser>;
};

export function LiveUsers() {
  const { user } = useUser();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeActiveUsers = (records: ActiveUserApiRecord[] = []): ActiveUser[] => {
    return records.map((record, index) => {
      const nestedUser = record.user ?? {};
      const name =
        (typeof record.name === 'string' && record.name.trim()) ||
        (typeof nestedUser.name === 'string' && nestedUser.name.trim()) ||
        (typeof record.email === 'string' && record.email.split('@')[0]) ||
        (typeof nestedUser.email === 'string' && nestedUser.email.split('@')[0]) ||
        'Unknown';

      const email =
        (typeof record.email === 'string' && record.email) ||
        (typeof nestedUser.email === 'string' && nestedUser.email) ||
        'unknown@example.com';

      const role =
        (typeof record.role === 'string' && record.role) ||
        (typeof nestedUser.role === 'string' && nestedUser.role) ||
        'agent';

      return {
        id: record.id || record.userId || `${email}-${index}`,
        name,
        email,
        role,
        lastHeartbeat: record.lastHeartbeat || new Date().toISOString(),
        isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
        isIdle: Boolean(record.isIdle)
      };
    });
  };

  const getInitial = (value: string) => {
    const safeValue = typeof value === 'string' ? value.trim() : '';
    return safeValue.length > 0 ? safeValue[0].toUpperCase() : '?';
  };

  useEffect(() => {
    if (!user) return;

    const fetchActiveUsers = async () => {
      try {
        const data = await apiFetch(`/api/time-tracking/active-users`);
        setActiveUsers(normalizeActiveUsers(data.data || []));
      } catch (error) {
        console.error('Failed to fetch active users:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchActiveUsers();
    // Polling fallback keeps data fresh if socket fails
    const pollInterval = setInterval(fetchActiveUsers, 30000);

    // Socket.io removed - polling only for Vercel compatibility
    // Keeping the polling interval for live updates
    return () => {
      clearInterval(pollInterval);
    };
  }, [user]);

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: Shield,
          gradient: 'from-purple-500 to-indigo-600',
          bg: 'bg-purple-500/10 dark:bg-purple-500/20',
          text: 'text-purple-600 dark:text-purple-400',
          label: 'Admin'
        };
      case 'sales':
        return {
          icon: Briefcase,
          gradient: 'from-blue-500 to-cyan-600',
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400',
          label: 'Sales'
        };
      case 'agent':
        return {
          icon: User,
          gradient: 'from-emerald-500 to-green-600',
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          label: 'Agent'
        };
      default:
        return {
          icon: User,
          gradient: 'from-gray-500 to-gray-600',
          bg: 'bg-gray-500/10 dark:bg-gray-500/20',
          text: 'text-gray-600 dark:text-gray-400',
          label: role
        };
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Users</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Currently online team members</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg shadow-emerald-500/20">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white font-semibold text-sm">{activeUsers.length} Online</span>
        </div>
      </div>

      {/* Users List */}
      {activeUsers.length > 0 ? (
        <div className="space-y-3">
          {activeUsers.map((activeUser, index) => {
            const roleConfig = getRoleConfig(activeUser.role);
            const RoleIcon = roleConfig.icon;

            return (
              <motion.div
                key={activeUser.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="group relative bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar with status */}
                    <div className="relative">
                      <div className={`w-12 h-12 bg-gradient-to-br ${roleConfig.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">
                          {getInitial(activeUser.name)}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${activeUser.isIdle ? 'bg-yellow-500' : 'bg-emerald-500'} ${!activeUser.isIdle ? 'animate-pulse' : ''}`}></div>
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{activeUser.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.bg} ${roleConfig.text}`}>
                          {roleConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activeUser.email}</p>
                    </div>
                  </div>

                  {/* Status & Time */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatLastSeen(activeUser.lastHeartbeat)}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${activeUser.isIdle ? 'bg-yellow-500/10 dark:bg-yellow-500/20' : 'bg-emerald-500/10 dark:bg-emerald-500/20'}`}>
                      <Activity className={`w-4 h-4 ${activeUser.isIdle ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <span className={`text-sm font-medium ${activeUser.isIdle ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {activeUser.isIdle ? 'Idle' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No active users currently</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Team members will appear here when they are online</p>
        </motion.div>
      )}
    </motion.div>
  );
}
