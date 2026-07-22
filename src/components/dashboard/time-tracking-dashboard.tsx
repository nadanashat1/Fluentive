"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
// Socket.io removed - using polling only
import { motion } from 'framer-motion';
import { Clock, Activity, TrendingUp, Zap, Users, Calendar, BarChart3, Timer, Flame } from 'lucide-react';
import { typedApi } from '@/services/typed-api.service';

interface TimeTrackingData {
  totalSeconds: number;
  totalHours: string;
  activeSeconds: number;
  idleSeconds: number;
  activeHours: string;
  idleHours: string;
  isIdle: boolean;
  productivityScore: number;
  isActive: boolean;
}

interface DailyStats {
  date: string;
  totalSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
  productivityScore: number;
  actionsCount: number;
  leadsCreated: number;
  leadsUpdated: number;
  leadsConverted: number;
}

export function TimeTrackingDashboard() {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState<TimeTrackingData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCurrentTime = async () => {
      try {
        const data = await typedApi.timeTracking.myTime();
        if (data && data.data && data.data.length > 0) {
          // Get the most recent record (first in the array) for current status
          setCurrentTime(data.data[0]);
          // Use all records for the daily stats table
          setDailyStats(data.data as any);
        }
      } catch (error: any) {
        if (error?.status === 401) return;
        console.error('Failed to fetch time tracking data:', error);
      }
    };

    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      await fetchCurrentTime();
      setLoading(false);
    };

    fetchData();

    const interval = setInterval(fetchData, 60000);

    // Socket.io removed - polling only for Vercel compatibility
    return () => clearInterval(interval);
  }, [user]);

  // Real-time timer - increments every second when session is active
  useEffect(() => {
    if (!currentTime?.isActive) {
      setDisplayTime(currentTime?.totalSeconds || 0);
      return;
    }

    setDisplayTime(currentTime.totalSeconds);

    const timer = setInterval(() => {
      setDisplayTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime?.totalSeconds, currentTime?.isActive]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-emerald-600';
    if (score >= 60) return 'from-blue-400 to-blue-600';
    if (score >= 40) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getProductivityBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 dark:bg-emerald-500/20';
    if (score >= 60) return 'bg-blue-500/10 dark:bg-blue-500/20';
    if (score >= 40) return 'bg-yellow-500/10 dark:bg-yellow-500/20';
    return 'bg-red-500/10 dark:bg-red-500/20';
  };

  const getProductivityLabel = (score: number) => {
    if (score >= 80) return { label: '🔥 High Performance', emoji: '🔥' };
    if (score >= 60) return { label: '⚡ Active', emoji: '⚡' };
    if (score >= 40) return { label: '😴 Idle', emoji: '😴' };
    return { label: '⚠️ Low Activity', emoji: '⚠️' };
  };

  const productivityScore = currentTime?.productivityScore || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Time Tracking
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your productivity and activity</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentTime?.isActive ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-gray-500/10 dark:bg-gray-500/20'}`}>
          {currentTime?.isActive && (
            <>
              <span className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="relative w-2 h-2 bg-emerald-500 rounded-full"></span>
            </>
          )}
          {!currentTime?.isActive && (
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          )}
          <span className={`text-sm font-medium ${currentTime?.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {currentTime?.isActive ? 'Live Session' : 'Offline'}
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Time Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg shadow-violet-500/20 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div className={`w-3 h-3 rounded-full ${currentTime?.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'}`}></div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Total Time</p>
            <p className="text-3xl font-bold text-white font-mono tracking-wider">
              {formatTime(displayTime)}
            </p>
            <p className="text-white/60 text-xs mt-2">{(displayTime / 3600).toFixed(2)} hours today</p>
          </div>
        </motion.div>

        {/* Active Time Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg shadow-blue-500/20 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <Flame className="w-5 h-5 text-orange-300" />
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Active Time</p>
            <p className="text-3xl font-bold text-white">
              {currentTime ? formatTime(currentTime.activeSeconds) : '00:00:00'}
            </p>
            <p className="text-white/60 text-xs mt-2">{currentTime?.activeHours || '0.00'} focused hours</p>
          </div>
        </motion.div>

        {/* Idle Time Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-amber-500/20 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className={`w-3 h-3 rounded-full ${currentTime?.isIdle ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Idle Time</p>
            <p className="text-3xl font-bold text-white">
              {currentTime ? formatTime(currentTime.idleSeconds) : '00:00:00'}
            </p>
            <p className="text-white/60 text-xs mt-2">{currentTime?.idleHours || '0.00'} break time</p>
          </div>
        </motion.div>

        {/* Productivity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className={`group relative bg-gradient-to-br ${getProductivityColor(productivityScore)} rounded-2xl p-6 shadow-lg overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <Zap className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Productivity</p>
            <p className="text-3xl font-bold text-white">
              {productivityScore}%
            </p>
            <p className="text-white/60 text-xs mt-2 flex items-center gap-1">
              <span>{getProductivityLabel(productivityScore).emoji}</span>
              <span>{getProductivityLabel(productivityScore).label.split(' ').slice(1).join(' ')}</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productivity Progress</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProductivityBg(productivityScore)} ${getProductivityColor(productivityScore).replace('from-', 'text-').split(' ')[0]}`}>
            {getProductivityLabel(productivityScore).label}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Active vs Idle Ratio</span>
              <span className="font-semibold text-gray-900 dark:text-white">{productivityScore}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${productivityScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${getProductivityColor(productivityScore)}`}
              ></motion.div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentTime ? formatTime(currentTime.activeSeconds) : '00:00:00'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Idle</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentTime ? formatTime(currentTime.idleSeconds) : '00:00:00'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Statistics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Statistics</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold text-sm">Date</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold text-sm">Total Time</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold text-sm">Active</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold text-sm">Idle</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold text-sm">Productivity</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.length > 0 ? (
                dailyStats.map((stat, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white font-mono">
                        {formatTime(stat.totalSeconds)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-blue-600 dark:text-blue-400 font-mono">
                        {formatTime(stat.activeSeconds)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        {formatTime(stat.idleSeconds)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.productivityScore}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full bg-gradient-to-r ${getProductivityColor(stat.productivityScore)}`}
                          ></motion.div>
                        </div>
                        <span className={`text-sm font-semibold ${getProductivityColor(stat.productivityScore).replace('from-', 'text-').split(' ')[0]}`}>
                          {stat.productivityScore}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No daily statistics available yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Start tracking to see your activity</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
