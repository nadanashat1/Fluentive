'use client';

import { useState } from 'react';

interface SidebarNavProps {
  isCollapsed: boolean;
  notifications: number;
  onToggleCollapse: () => Promise<void>;
  isNavigating: boolean;
  indicatorY: number;
  onNavigationStart: () => Promise<void>;
  onIndicatorChange: (y: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function SidebarNav({
  isCollapsed,
  notifications,
  onToggleCollapse,
  isNavigating,
  indicatorY,
  onNavigationStart,
  onIndicatorChange,
  containerRef
}: SidebarNavProps) {
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'deals', label: 'Deals', icon: '💼' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <a
          key={item.id}
          href={`/${item.id}`}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeItem === item.id
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => {
            setActiveItem(item.id);
            onNavigationStart();
          }}
        >
          <span className="mr-3">{item.icon}</span>
          {item.label}
          {notifications > 0 && item.id === 'dashboard' && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {notifications}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}
