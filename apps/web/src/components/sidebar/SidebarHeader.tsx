'use client';

import { useState } from 'react';

interface SidebarHeaderProps {
  collapsed: boolean;
  isOnline: boolean;
  notificationCount: number;
  onToggleCollapse: () => Promise<void>;
  onRefreshNotifications: () => Promise<void>;
}

export function SidebarHeader({
  collapsed,
  isOnline,
  notificationCount,
  onToggleCollapse,
  onRefreshNotifications
}: SidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">Fluentive</h1>
            <p className="text-sm text-gray-600">Sales Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7-6h.01M9 9h.01M4 12h.01M9 19h.01" />
            </svg>
          </button>
          <button
            onClick={onRefreshNotifications}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
            title="Refresh notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.293-1.293a1 1 0 01-1.414 1.414L10 15.586l-5.293 5.293a1 1 0 01-.707-.293L15 17z" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
