"use client";

import { useEffect, useState } from "react";
// Socket.io removed - using polling only
import { apiFetch } from "@/lib/api-client";
import { formatActivityTime } from "@/lib/activity-logs/format-time";

interface Activity {
  id: string;
  type: string;
  title: string;
  meta: any;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const response = await apiFetch<{ success: true; data: Activity[]; count: number }>("/api/activity-logs");
      setActivities(response.data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Polling only - Vercel doesn't support WebSockets
    const poll = setInterval(fetchActivities, 30000);

    return () => {
      clearInterval(poll);
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return "👤";
      case "lead":
        return "🎯";
      case "payment":
        return "💳";
      case "system":
        return "⚙️";
      default:
        return "📌";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "lead":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "payment":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "system":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 w-full rounded-lg2" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-[#646b7a] dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] hover:bg-[#f8f9fa] dark:hover:bg-[#0f0820] transition"
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#2f3440] dark:text-gray-200">
              {activity.title}
            </p>
            {activity.user && (
              <p className="text-[12px] text-[#646b7a] dark:text-gray-400 mt-0.5">
                by {activity.user.name}
              </p>
            )}
            <p className="text-[11px] text-[#8b8f9b] dark:text-gray-500 mt-1">
              {formatActivityTime(activity.createdAt).relative}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
