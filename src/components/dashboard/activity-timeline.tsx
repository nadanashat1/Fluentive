"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext-production';
import { motion } from 'framer-motion';
import { Clock, LogIn, Eye, Coffee, Zap, FileText, Users, Settings, LogOut, Trash2, TrendingUp, Target, Mail, Phone, MessageSquare } from 'lucide-react';
import { typedApi } from '@/services/typed-api.service';

interface ActivityEvent {
  id: string;
  type: string;
  description?: string;
  createdAt: string;
  user?: { name: string };
  lead?: { name: string };
  deal?: { title: string };
}

import { apiFetch } from '@/lib/api-client';

export function ActivityTimeline() {
  const { state } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        const result = await apiFetch(`/api/activities?limit=15`);
        if (result.success) {
          setActivities(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const formatTime = (dateString: string) => {
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

  const getEventConfig = (type: string) => {
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'login': return { icon: LogIn, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'create': return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'update': return { icon: Settings, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'delete': return { icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'status_change': return { icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/10' };
      case 'call': return { icon: Phone, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
      case 'email': return { icon: Mail, color: 'text-sky-500', bg: 'bg-sky-500/10' };
      case 'meeting': return { icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'note': return { icon: MessageSquare, color: 'text-gray-500', bg: 'bg-gray-500/10' };
      default: return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-400/10' };
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#202530] dark:text-gray-100 flex items-center gap-2">
          <Activity className="text-brand" size={20} />
          Business Activity
        </h2>
        <span className="text-[11px] font-bold text-[#8b8f9b] uppercase tracking-wider bg-[#f5f6f8] dark:bg-[#110724] px-2 py-0.5 rounded">
          Live
        </span>
      </div>

      <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-[#ececef] dark:before:bg-[#2a2f3a]">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const config = getEventConfig(activity.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-4 pl-0"
              >
                <div className={`relative z-10 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center border-4 border-white dark:border-[#1a0b2e]`}>
                  <Icon className={`${config.color}`} size={16} />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-[#202530] dark:text-gray-100 truncate">
                      {activity.description}
                    </p>
                    <span className="text-[11px] font-medium text-[#8b8f9b] dark:text-gray-500 whitespace-nowrap">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[#8b8f9b] dark:text-gray-500">
                      by <span className="font-semibold text-brand/80">{activity.user?.name || 'System'}</span>
                    </span>
                    {(activity.lead || activity.deal) && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {activity.lead?.name || activity.deal?.title}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          </div>
        )}
      </div>

      <button className="w-full mt-6 py-2 text-[12px] font-bold text-[#646b7a] dark:text-gray-400 hover:text-brand transition-colors border border-[#ececef] dark:border-[#2a2f3a] rounded-soft hover:bg-[#f5f6f8] dark:hover:bg-[#110724]">
        View Detailed Logs
      </button>
    </section>
  );
}

import { Activity } from 'lucide-react';
