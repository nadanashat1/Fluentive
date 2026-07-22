'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';
import { authService } from '@/services/authService';

interface UserSettings {
  id: string;
  email: string;
  name: string;
  role: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    sidebarCollapsed: boolean;
    autoSave: boolean;
  };
}

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUserSettings();
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (updatedSettings: Partial<UserSettings>) => {
    try {
      setSaving(true);
      const response = await apiService.updateUserSettings(updatedSettings);
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Redirect to login page or handle logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <SidebarHeader 
          collapsed={false}
          isOnline={true}
          notificationCount={0}
          onToggleCollapse={async () => {}}
          onRefreshNotifications={async () => {}}
        />
        <nav className="mt-8">
          <SidebarNav 
            collapsed={false}
            isTransitioning={false}
            isNavigating={false}
            indicatorY={0}
            onNavigationStart={async () => {}}
            onIndicatorChange={() => {}}
            containerRef={containerRef}
          />
        </nav>
        <SidebarFooter 
          collapsed={false}
          isOnline={true}
          isNavigating={false}
          onLogout={handleLogout}
          onNavigationStart={async () => {}}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Settings Sections */}
            <Suspense fallback={<div>Loading settings...</div>}>
              <div className="space-y-8">
                {/* Profile Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : settings ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={settings.name}
                              onChange={(e) => setSettings({...settings, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={settings.email}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <input
                              type="text"
                              value={settings.role}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                            <select
                              value={settings.timezone}
                              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">Eastern Time</option>
                              <option value="America/Los_Angeles">Pacific Time</option>
                              <option value="Europe/London">London</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSaveSettings(settings)}
                            disabled={saving}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No settings available
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
                  <div className="space-y-4">
                    {settings && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                            <p className="text-sm text-gray-500">Receive email updates about your account</p>
                          </div>
                          <button
                            onClick={() => setSettings({
                              ...settings,
                              notifications: {...settings.notifications, email: !settings.notifications.email}
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                            <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                          </div>
                          <button
                            onClick={() => setSettings({
                              ...settings,
                              notifications: {...settings.notifications, push: !settings.notifications.push}
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                            <p className="text-sm text-gray-500">Receive text message updates</p>
                          </div>
                          <button
                            onClick={() => setSettings({
                              ...settings,
                              notifications: {...settings.notifications, sms: !settings.notifications.sms}
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.notifications.sms ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.notifications.sms ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h2>
                  <div className="space-y-4">
                    {settings && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                            <p className="text-sm text-gray-500">Choose your preferred theme</p>
                          </div>
                          <select
                            value={settings.preferences.theme}
                            onChange={(e) => setSettings({
                              ...settings,
                              preferences: {...settings.preferences, theme: e.target.value as 'light' | 'dark' | 'auto'}
                            })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Auto-save</h3>
                            <p className="text-sm text-gray-500">Automatically save your work</p>
                          </div>
                          <button
                            onClick={() => setSettings({
                              ...settings,
                              preferences: {...settings.preferences, autoSave: !settings.preferences.autoSave}
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.preferences.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Suspense>
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="John Doe"
                        aria-label="Full Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="john.doe@example.com"
                        aria-label="Email Address"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="+1 (555) 123-4567"
                        aria-label="Phone Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-xs text-gray-500">Receive email updates</p>
                      </div>
                      <button 
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Toggle Email Notifications"
                        title="Toggle Email Notifications"
                      >
                        <span className="translate-x-1 translate-y-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                        <p className="text-xs text-gray-500">Browser push notifications</p>
                      </div>
                      <button 
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Toggle Push Notifications"
                        title="Toggle Push Notifications"
                      >
                        <span className="translate-x-1 translate-y-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                        <p className="text-xs text-gray-500">Text message alerts</p>
                      </div>
                      <button 
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Toggle SMS Notifications"
                        title="Toggle SMS Notifications"
                      >
                        <span className="translate-x-1 translate-y-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="•••••"
                        aria-label="Current Password"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Extra security layer</p>
                      </div>
                      <button 
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Toggle Two-Factor Authentication"
                        title="Toggle Two-Factor Authentication"
                      >
                        <span className="translate-x-1 translate-y-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Session Timeout</label>
                        <p className="text-xs text-gray-500">Auto-logout inactivity</p>
                      </div>
                      <select 
                        id="sessionTimeout"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Session Timeout"
                        title="Session Timeout"
                      >
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>4 hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
