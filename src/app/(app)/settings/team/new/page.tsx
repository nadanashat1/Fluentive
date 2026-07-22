"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Shield, Lock, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

export default function InviteTeamMemberPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales"
  });

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      showToast("Name, email, and temporary password are required", "error");
      return;
    }

    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch<{ status: string; message: string }>("/api/users", {
        method: "POST",
        body: JSON.stringify(form)
      });

      if (res.status === "success") {
        showToast("Team representative invited successfully", "success");
        router.push("/sales-team");
      } else {
        showToast(res.message || "Failed to invite representative", "error");
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to invite team member", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f6fb] dark:bg-[#0b0614] pb-12">
      {/* Header Banner */}
      <div className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserPlus className="text-brand" size={24} /> Invite Sales Representative
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create an account credential and assign quota capabilities for your new team member.
            </p>
          </div>
          <Link href="/sales-team" className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Leaderboard
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={inviteMember} className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
        <div className="space-y-6 bg-white dark:bg-[#150a24] rounded-2xl border border-[#ececef] dark:border-[#2a2f3a] p-6 sm:p-8 shadow-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Marcus Sterling"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Work Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                placeholder="marcus@fluentive.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Temporary Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                required
                minLength={8}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Minimum 8 characters. Representative will be prompted to change this upon initial login.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Assigned Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition appearance-none"
              >
                <option value="sales">Sales Representative</option>
                <option value="manager">Sales Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[#ececef] dark:border-[#2a2f3a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 px-5 rounded-soft text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-soft bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {saving ? "Inviting Rep..." : "Invite Representative"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
