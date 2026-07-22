"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Oops, your passwords don't match. Try again!");
      return;
    }

    if (password.length < 8) {
      setError("Password needs at least 8 characters. Make it longer!");
      return;
    }

    setLoading(true);

    try {
      await apiFetch<{ success: true }>(`/api/auth/resetpassword/${token}`, {
        method: "PUT",
        body: JSON.stringify({ password })
      });
      setSuccess(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("We couldn't reset your password. Try again?");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6f8] px-6 py-10">
        <div className="w-full max-w-[520px] rounded-3xl border border-[#e7e9ef] bg-white p-8 shadow-sm text-center">
          <h1 className="text-[40px] font-semibold text-[#242933]">You're all set! 🎉</h1>
          <p className="mt-4 text-[18px] text-[#5f6674]">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-brand px-8 py-4 text-[18px] font-semibold text-white shadow-button"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f8] px-6 py-10">
      <div className="w-full max-w-[520px] rounded-3xl border border-[#e7e9ef] bg-white p-8 shadow-sm">
        <h1 className="text-[40px] font-semibold text-[#242933]">Reset Password</h1>
        <p className="mt-2 text-[18px] text-[#5f6674]">
          Enter your new password below.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-[#f25572]/30 bg-[#f25572]/10 p-4 text-[14px] text-[#f25572]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-[16px] font-medium text-[#2f3440]">New Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a9b5]" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 w-full rounded-xl border border-[#e4e6ec] bg-[#f7f8fb] pl-12 pr-12 text-[18px] outline-none placeholder:text-[#b2b6c2]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a5a9b5]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-[16px] font-medium text-[#2f3440]">Confirm New Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a9b5]" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-14 w-full rounded-xl border border-[#e4e6ec] bg-[#f7f8fb] pl-12 pr-4 text-[18px] outline-none placeholder:text-[#b2b6c2]"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-xl bg-brand text-[20px] font-semibold text-white shadow-button disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset my password"}
          </button>
        </form>

        <div className="mt-6 text-center text-[14px]">
          <Link href="/login" className="font-semibold text-brand">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
