'use client';

interface SidebarFooterProps {
  collapsed: boolean;
  isOnline: boolean;
  isNavigating: boolean;
  onLogout: () => Promise<void>;
  onNavigationStart: () => Promise<void>;
}

export function SidebarFooter({
  collapsed,
  isOnline,
  isNavigating,
  onLogout,
  onNavigationStart
}: SidebarFooterProps) {
  return (
    <div className="mt-auto p-6 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Logout"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
