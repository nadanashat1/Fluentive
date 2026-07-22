"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils/error";
import { useUser } from "@/contexts/user-context";
import { userCanManageUsers } from "@/lib/ui-user-utils";
import { RefreshCw, Save, Shield, Bell, User, Key } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// Temporary fix for build error
const useToast = () => ({
  showToast: (title: string, description?: string, variant?: string) => {
    console.log(`Toast: ${title} - ${description || ''}`);
  }
});

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
}

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  browserEnabled: boolean;
  leadCreatedEnabled: boolean;
  leadConvertedEnabled: boolean;
  leadDeletedEnabled: boolean;
  userRegisteredEnabled: boolean;
  aiScoreEnabled: boolean;
  fileUploadEnabled: boolean;
  importantNoteEnabled: boolean;
  churnRiskEnabled: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUser();
    fetchPreferences();
  }, []);

  const fetchUser = async () => {
    try {
      const data = await apiFetch<{ success: true; data: User }>("/api/auth/me");
      setUser(data.data);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(getErrorMessage(e));
      } else {
        setError("We couldn't load your settings. Let's try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    setPreferencesLoading(true);
    try {
      const data = await apiFetch<{ success: true; data: NotificationPreferences }>("/api/notification-preferences");
      setPreferences(data.data);
    } catch (e) {
      console.error("Failed to fetch notification preferences:", e);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    setSavingPreferences(true);
    try {
      const data = await apiFetch<{ success: true; data: NotificationPreferences }>("/api/notification-preferences", {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      setPreferences(data.data);
      showToast("Notification preferences updated successfully", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to update preferences"), "error");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const data = await apiFetch<{ success: true; data: { secret: string; qrCode: string } }>("/api/auth/2fa/enable", {
        method: "POST"
      });
      setSecret(data.data.secret);
      setQrCode(data.data.qrCode);
      setShow2FASetup(true);
      showToast("2FA setup started! Scan the QR code with your authenticator app.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "We couldn't enable 2FA. Try again?"), "error");
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ token })
      });
      setShow2FASetup(false);
      setToken("");
      fetchUser();
      showToast("2FA enabled! Your account is now extra secure.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "That code didn't work. Try again?"), "error");
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Disable 2FA? Your account will be less secure.")) return;

    try {
      await apiFetch("/api/auth/2fa/disable", {
        method: "POST"
      });
      fetchUser();
      showToast("2FA disabled. Done.", "success");
    } catch (e) {
      showToast(getErrorMessage(e, "We couldn't disable 2FA. Try again?"), "error");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      showToast("Password changed successfully", "success");
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      showToast(getErrorMessage(e, "Failed to change password"), "error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-40 w-full rounded-lg2" />
        <div className="skeleton h-24 w-full rounded-lg2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#f25572]">Oops, something went wrong</p>
          <p className="mt-1 text-[14px] text-[#8b8f9b] dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">Settings ⚙️</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2 disabled:opacity-50"
          title="Refresh settings"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#1a0b2e]">
        <p className="text-[12px] text-[#6b7280] dark:text-gray-400">
          <span className="font-semibold text-[#840A36]">🔒 Security:</span> Manage your account settings, update your password, and enable two-factor authentication for enhanced security.
        </p>
      </div>

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] text-[#646b7a] dark:text-gray-400 mb-0.5">Name</label>
            <p className="text-[15px] text-[#2f3440] dark:text-gray-200">{user?.name}</p>
          </div>
          <div>
            <label className="block text-[13px] text-[#646b7a] dark:text-gray-400 mb-0.5">Email</label>
            <p className="text-[15px] text-[#2f3440] dark:text-gray-200">{user?.email}</p>
          </div>
          <div>
            <label className="block text-[13px] text-[#646b7a] dark:text-gray-400 mb-0.5">Role</label>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
              userCanManageUsers(user) ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
            <Key size={18} />
            Change Password
          </h2>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e]"
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordChange && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
                minLength={8}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1 rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2.5 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changingPassword}
                className="flex-1 rounded-soft bg-brand px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 mb-4">Two-Factor Authentication</h2>
        {user?.twoFactorEnabled ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] text-[#2f3440] dark:text-gray-200">2FA is enabled</p>
              <p className="text-[13px] text-[#646b7a] dark:text-gray-400">Your account is protected with 2FA</p>
            </div>
            <button
              onClick={handleDisable2FA}
              className="self-start rounded-soft border border-[#f25572] px-4 py-2 text-[13px] font-semibold text-[#f25572] transition hover:bg-[#f25572]/5"
            >
              Disable
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] text-[#2f3440] dark:text-gray-200">2FA is disabled</p>
              <p className="text-[13px] text-[#646b7a] dark:text-gray-400">Enable 2FA for extra security</p>
            </div>
            <button
              onClick={handleEnable2FA}
              className="self-start rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand/90"
            >
              Enable
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
            <Bell size={18} />
            Notification Preferences
          </h2>
          {preferences && (
            <button
              onClick={() => updatePreferences({})}
              disabled={savingPreferences}
              className="rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={14} />
              {savingPreferences ? 'Saving...' : 'Saved'}
            </button>
          )}
        </div>

        {preferencesLoading ? (
          <div className="skeleton h-40 w-full" />
        ) : preferences ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[#f0f1f3] dark:border-[#2a2f3a]">
              <div>
                <p className="text-[14px] font-medium text-[#2f3440] dark:text-gray-200">Browser Notifications</p>
                <p className="text-[12px] text-[#646b7a] dark:text-gray-400">Show notifications in your browser</p>
              </div>
              <button
                onClick={() => updatePreferences({ browserEnabled: !preferences.browserEnabled })}
                disabled={savingPreferences}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.browserEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                } disabled:opacity-50`}
                title={preferences.browserEnabled ? 'Disable browser notifications' : 'Enable browser notifications'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.browserEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 uppercase tracking-wide">Lead Notifications</p>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">Lead Created</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">When a new lead is added</p>
                </div>
                <button
                  onClick={() => updatePreferences({ leadCreatedEnabled: !preferences.leadCreatedEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.leadCreatedEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.leadCreatedEnabled ? 'Disable lead created notifications' : 'Enable lead created notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.leadCreatedEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">Lead Converted</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">When a lead becomes a customer</p>
                </div>
                <button
                  onClick={() => updatePreferences({ leadConvertedEnabled: !preferences.leadConvertedEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.leadConvertedEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.leadConvertedEnabled ? 'Disable lead converted notifications' : 'Enable lead converted notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.leadConvertedEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">Lead Deleted</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">When a lead is removed</p>
                </div>
                <button
                  onClick={() => updatePreferences({ leadDeletedEnabled: !preferences.leadDeletedEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.leadDeletedEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.leadDeletedEnabled ? 'Disable lead deleted notifications' : 'Enable lead deleted notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.leadDeletedEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 uppercase tracking-wide">AI & Analytics</p>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">High AI Score Leads</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">When a lead scores 80+</p>
                </div>
                <button
                  onClick={() => updatePreferences({ aiScoreEnabled: !preferences.aiScoreEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.aiScoreEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.aiScoreEnabled ? 'Disable AI score notifications' : 'Enable AI score notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.aiScoreEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">Churn Risk Alerts</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">High churn risk detected</p>
                </div>
                <button
                  onClick={() => updatePreferences({ churnRiskEnabled: !preferences.churnRiskEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.churnRiskEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.churnRiskEnabled ? 'Disable churn risk notifications' : 'Enable churn risk notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.churnRiskEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 uppercase tracking-wide">Other</p>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">File Uploads</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">When files are uploaded to leads</p>
                </div>
                <button
                  onClick={() => updatePreferences({ fileUploadEnabled: !preferences.fileUploadEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.fileUploadEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.fileUploadEnabled ? 'Disable file upload notifications' : 'Enable file upload notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.fileUploadEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[14px] text-[#2f3440] dark:text-gray-200">Important Notes</p>
                  <p className="text-[12px] text-[#646b7a] dark:text-gray-400">When important notes are added</p>
                </div>
                <button
                  onClick={() => updatePreferences({ importantNoteEnabled: !preferences.importantNoteEnabled })}
                  disabled={savingPreferences}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    preferences.importantNoteEnabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                  } disabled:opacity-50`}
                  title={preferences.importantNoteEnabled ? 'Disable important note notifications' : 'Enable important note notifications'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      preferences.importantNoteEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[#646b7a] dark:text-gray-400">Failed to load notification preferences</p>
        )}
      </div>

      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6 shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-bold text-[#2f3440] dark:text-gray-100 mb-4">Setup 2FA</h2>
            <div className="space-y-4">
              <div className="text-center">
                <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                <p className="mt-2 text-[13px] text-[#646b7a] dark:text-gray-400">Scan this QR code with your authenticator app</p>
                <p className="text-[12px] text-[#8f93a1] dark:text-gray-500 mt-1">Secret: {secret}</p>
              </div>
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label htmlFor="2fa-token" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">
                    Enter 6-digit code
                  </label>
                  <input
                    id="2fa-token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShow2FASetup(false)}
                    className="flex-1 rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2.5 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-soft bg-brand px-4 py-2.5 text-[13px] font-semibold text-white"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
