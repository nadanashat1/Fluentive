"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch<{ success: true }>("/api/auth/forgotpassword", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setSuccess(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("We couldn't send the reset link. Try again?");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6f8] px-6 py-10">
        <div className="w-full max-w-[520px] rounded-3xl border border-[#e7e9ef] bg-white p-8 shadow-sm text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-[40px] font-semibold text-[#242933]">Check your inbox! 📬</h1>
          <p className="mt-4 text-[18px] text-[#5f6674]">
            We have sent a temporary password to your email address. Use it to log in and then change your password immediately.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-[#f7f8fb] border border-[#e4e6ec]">
            <p className="text-[14px] text-[#6b7280]">
              <span className="font-semibold text-[#840A36]">⏰ Quick Tip:</span> The temporary password is valid until you change it. For security, please update your password right after logging in.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-brand px-8 py-4 text-[18px] font-semibold text-white shadow-button"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f8] px-6 py-10">
      <div className="w-full max-w-[520px] rounded-3xl border border-[#e7e9ef] bg-white p-8 shadow-sm">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-[40px] font-semibold text-[#242933]">Forgot Password?</h1>
        <p className="mt-2 text-[18px] text-[#5f6674]">
          No worries! Enter your email address and we'll send you a temporary password to access your account.
        </p>
        <div className="mt-4 p-4 rounded-xl bg-[#f7f8fb] border border-[#e4e6ec]">
          <p className="text-[14px] text-[#6b7280]">
            <span className="font-semibold text-[#840A36]">🔒 Security:</span> We'll send a secure temporary password to your email. You can use it to log in and then change your password in settings.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#f25572]/30 bg-[#f25572]/10 p-4 text-[14px] text-[#f25572]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-[16px] font-medium text-[#2f3440]">Email Address</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a9b5]" size={20} />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send me a reset link"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-[14px]">
          <Link href="/login" className="font-semibold text-brand">
            Back to Login
          </Link>
          <Link href="/register" className="font-semibold text-brand">
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
