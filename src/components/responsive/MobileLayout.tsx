'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, Settings, Home, Users, BarChart3, FileText, Search, Plus } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
  onSidebarToggle?: () => void;
}

/**
 * Mobile-Responsive Layout Component
 * Provides adaptive layout for mobile and desktop devices
 * Includes collapsible sidebar and mobile navigation
 */

export function MobileLayout({ 
  children, 
  title = 'Fluentive CRM', 
  showSidebar = true,
  onSidebarToggle 
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: Users, label: 'Leads', href: '/leads' },
    { icon: FileText, label: 'Deals', href: '/deals' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Mobile Search */}
              <button 
                title="Search"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search size={20} />
              </button>
              
              {/* Notifications */}
              <button 
                title="Notifications"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User Menu */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">U</span>
                </div>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </a>
              ))}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                <span className="font-medium">New Lead</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && showSidebar && (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Fluentive CRM</h1>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </a>
              ))}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                <span className="font-medium">New Lead</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isMobile ? 'pt-16' : showSidebar ? 'ml-64' : 'ml-0'
      }`}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex items-center justify-around py-2">
            {navigationItems.slice(0, 5).map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  item.active 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Notifications Panel */}
      {notificationsOpen && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Container Component
 * Provides responsive container with proper padding and max-width
 */
export function ResponsiveContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Responsive Grid Component
 * Provides responsive grid layout that adapts to screen size
 */
export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = '' 
}: { 
  children: React.ReactNode; 
  cols?: { mobile: number; tablet: number; desktop: number };
  gap?: number;
  className?: string; 
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={`
      grid 
      ${gridClasses[cols.mobile as keyof typeof gridClasses]} 
      sm:${gridClasses[cols.tablet as keyof typeof gridClasses]} 
      lg:${gridClasses[cols.desktop as keyof typeof gridClasses]}
      ${gapClasses[gap as keyof typeof gapClasses]}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * Responsive Card Component
 * Provides responsive card that adapts to mobile and desktop
 */
export function ResponsiveCard({ 
  children, 
  title, 
  actions,
  className = '' 
}: { 
  children: React.ReactNode; 
  title?: string; 
  actions?: React.ReactNode;
  className?: string; 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {actions && (
              <div className="flex flex-shrink-0 space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Responsive Table Component
 * Provides responsive table that works on mobile devices
 */
export function ResponsiveTable({ 
  headers, 
  rows, 
  className = '' 
}: { 
  headers: string[]; 
  rows: string[][]; 
  className?: string; 
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Responsive Form Component
 * Provides responsive form layout that adapts to screen size
 */
export function ResponsiveForm({ 
  children, 
  onSubmit, 
  className = '' 
}: { 
  children: React.ReactNode; 
  onSubmit?: (e: React.FormEvent) => void; 
  className?: string; 
}) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </form>
  );
}

/**
 * Responsive Button Component
 * Provides responsive button that adapts to mobile and desktop
 */
export function ResponsiveButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button'
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${disabledClasses}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
