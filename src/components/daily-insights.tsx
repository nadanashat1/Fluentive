"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { motion } from 'framer-motion';
import { Flame, Clock, TrendingUp, Sun, Moon, Coffee, Zap, Target } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface DailyInsight {
  totalHours: number;
  productiveHours: number;
  idleHours: number;
  peakActivityHour: string;
  productivityScore: number;
  longestFocusSession: number;
  breakCount: number;
}

export function DailyInsights() {
  const { user } = useUser();
  const [insights, setInsights] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInsights = async () => {
      try {
        const response = await apiFetch(`/api/time-tracking/my-time`);

        if (response) {
          const data = response as any;
          if (data.data && data.data.length > 0) {
            const timeTracking = data.data[0];
            const totalHours = timeTracking.totalSeconds / 3600;
            const productiveHours = timeTracking.activeSeconds / 3600;
            const idleHours = timeTracking.idleSeconds / 3600;
            
            const lastHeartbeat = new Date(timeTracking.lastHeartbeat || Date.now());
            const peakActivityHour = lastHeartbeat.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const longestFocusSession = Math.max(Math.round((timeTracking.activeSeconds || 0) / 60), 0);
            
            // Estimate break count (every 5+ minutes of idle)
            const breakCount = Math.floor(idleHours * 60 / 5);

            setInsights({
              totalHours,
              productiveHours,
              idleHours,
              peakActivityHour,
              productivityScore: timeTracking.productivityScore,
              longestFocusSession,
              breakCount
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [user]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!insights) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center"
      >
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No activity data for today</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start tracking to see your daily insights</p>
      </motion.div>
    );
  }

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-emerald-600';
    if (score >= 60) return 'from-blue-400 to-blue-600';
    if (score >= 40) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getProductivityLabel = (score: number) => {
    if (score >= 80) return '🔥 High Performance';
    if (score >= 60) return '⚡ Active';
    if (score >= 40) return '😴 Moderate';
    return '⚠️ Low Activity';
  };

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
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Insights</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your productivity story today</p>
          </div>
        </div>
        <div className={`px-4 py-2 bg-gradient-to-r ${getProductivityColor(insights.productivityScore)} rounded-full shadow-lg`}>
          <span className="text-white font-semibold text-sm">{getProductivityLabel(insights.productivityScore)}</span>
        </div>
      </div>

      {/* Main Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 mb-6 shadow-lg shadow-violet-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative">
          <p className="text-white/80 text-sm font-medium mb-2">Total Work Time</p>
          <p className="text-4xl font-bold text-white mb-1">
            {insights.totalHours.toFixed(1)}h
          </p>
          <p className="text-white/60 text-sm">
            {insights.productiveHours.toFixed(1)}h productive • {insights.idleHours.toFixed(1)}h idle
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Peak Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Peak Activity</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.peakActivityHour}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Most productive hour</p>
        </motion.div>

        {/* Longest Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Longest Focus</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.longestFocusSession.toFixed(0)}m</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Continuous work</p>
        </motion.div>

        {/* Break Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Breaks Taken</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.breakCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rest periods</p>
        </motion.div>

        {/* Productivity Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Productivity</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.productivityScore}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score today</p>
        </motion.div>
      </div>

      {/* Insight Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Daily Summary</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {insights.productivityScore >= 80 
                ? "🔥 Amazing productivity today! You're crushing it."
                : insights.productivityScore >= 60
                ? "⚡ Good work today! Keep up the momentum."
                : insights.productivityScore >= 40
                ? "😴 Moderate day. Try to minimize idle time."
                : "⚠️ Low productivity. Consider taking more focused breaks."
              }
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
