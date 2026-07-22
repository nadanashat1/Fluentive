"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { ROUTES } from "@/lib/api-endpoints";
import { Search, RefreshCw, Filter, Download, UserPlus, Shield, Lock } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { userCanManageUsers } from "@/lib/ui-user-utils";
import { useToast } from "@/components/ui/toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  loginAttemptCount: number;
  lockUntil: string | null;
  _count: { leads: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<{ success: true; data: User[] }>(ROUTES.users.list);
      setUsers(data.data);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403) {
          setError("Hey, you don't have permission to view this page.");
        } else {
          setError(e.message);
        }
      } else {
        setError("We couldn't load the users. Let's try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? We can't undo this.")) return;

    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "We couldn't delete the user. Try again?");
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      await apiFetch(`/api/users/${id}/unlock`, { method: "PUT" });
      fetchUsers();
      showToast("User unlocked! All set.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "We couldn't unlock the user. Try again?", "error");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = search === "" || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "" || user.role === roleFilter;
    const isLocked = user.lockUntil && new Date(user.lockUntil) > new Date();
    const matchesStatus = statusFilter === "" || (statusFilter === "locked" ? isLocked : !isLocked);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-3 grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-lg2" />)}
        </div>
        <div className="skeleton h-64 w-full rounded-lg2" />
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

  const activeCount = users.filter(u => !u.lockUntil || new Date(u.lockUntil) <= new Date()).length;
  const lockedCount = users.length - activeCount;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">User Management 👥</h1>
          <p className="text-[13px] text-[#8b8f9b] dark:text-gray-400">{filteredUsers.length} of {users.length} users</p>
          <div className="mt-3 p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#1a0b2e]">
            <p className="text-[12px] text-[#6b7280] dark:text-gray-400">
              <span className="font-semibold text-[#840A36]">Quick Guide:</span> Manage user accounts, roles, and access. Add new users or lock or unlock accounts as needed.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2 disabled:opacity-50"
            title="Refresh users"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2"
            title="Export users"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand/90 flex items-center gap-2"
          >
            <UserPlus size={14} />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b9fad] dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <select
            title="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="sales_manager">Sales Manager</option>
            <option value="sales">Sales</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            title="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">
          <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Total Users</p>
          <p className="mt-1 text-xl font-bold text-[#2f3440] dark:text-gray-100">{users.length}</p>
        </div>
        <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">
          <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Active</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">
          <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Locked</p>
          <p className="mt-1 text-xl font-bold text-[#f25572]">{lockedCount}</p>
        </div>
      </div>

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-[#f8f9fa] dark:bg-[#0f0820] text-left">
              <tr>
                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Email</th>
                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Role</th>
                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Leads</th>
                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#f0f1f3] dark:border-[#2a2f3a] hover:bg-[#fafbfc] dark:hover:bg-[#1f1035] transition-colors">
                  <td className="px-4 py-3 text-[14px] font-medium text-[#2f3440] dark:text-gray-200">{user.name}</td>
                  <td className="px-4 py-3 text-[14px] text-[#646b7a] dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                      userCanManageUsers(user) ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-[#646b7a] dark:text-gray-400">{user._count?.leads ?? 0}</td>
                  <td className="px-4 py-3">
                    {user.lockUntil && new Date(user.lockUntil) > new Date() ? (
                      <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[12px] font-semibold text-red-700 dark:text-red-400">
                        Locked
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-[12px] font-semibold text-green-700 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {user.lockUntil && new Date(user.lockUntil) > new Date() && (
                      <button
                        onClick={() => handleUnlock(user.id)}
                        className="text-[13px] font-semibold text-brand hover:underline"
                      >
                        Unlock
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-[13px] font-semibold text-[#f25572] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-8 text-center text-[14px] text-[#8b8f9b] dark:text-gray-400">No users found yet. Add some to get started!</div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role })
      });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't create the user. Try again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6 shadow-2xl animate-fadeIn">
        <h2 className="text-xl font-bold text-[#2f3440] dark:text-gray-100 mb-4">Add New User</h2>
        {error && (
          <div className="mb-4 rounded-xl border border-[#f25572]/30 bg-[#f25572]/10 p-4 text-[14px] text-[#f25572]">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-name" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">Name</label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user name"
              className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
              required
            />
          </div>
          <div>
            <label htmlFor="user-email" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">Email</label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
              required
            />
          </div>
          <div>
            <label htmlFor="user-password" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">Password</label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
              required
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="user-role" className="block text-[13px] font-medium text-[#2f3440] dark:text-gray-200 mb-1">Role</label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2.5 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-soft bg-brand px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
