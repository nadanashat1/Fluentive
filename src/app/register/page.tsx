"use client";



import { useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { Lock, Mail, User, Eye, EyeOff, Moon, Sun } from "lucide-react";

import { api } from "@/lib/api";

import { ApiError } from "@/lib/apiClient";

import { ROUTES } from "@/lib/api-endpoints";

import LeftSideHero from "@/components/LeftSideHero";

import { useTheme } from "@/contexts/theme-context";



export default function RegisterPage() {

  const router = useRouter();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const [shake, setShake] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { theme, toggleTheme } = useTheme();



  const handleSubmit = async (event: React.FormEvent) => {

    event.preventDefault();

    setError(null);

    setShake(false);



    if (password !== confirmPassword) {

      setError("Oops, your passwords don't match. Try again!");

      setShake(true);

      setTimeout(() => setShake(false), 400);

      return;

    }



    setLoading(true);

    try {

      const response = await api.auth.register({
        name,
        email,
        password
      });

      

      // Tokens are now stored in httpOnly cookies for security

      

      setSuccess(true);

      // Wait for cookies to be properly set before navigation
      setTimeout(async () => {
        await new Promise(res => setTimeout(res, 300));
        router.push("/dashboard");
      }, 1200);

    } catch (e) {

      if (e instanceof ApiError) {

        // Handle specific error cases with better UX
        if (e.message.includes('User already exists') || e.message.includes('already in use')) {
          setError('This email is already registered. Try logging in instead?');
        } else if (e.message.includes('too weak') || e.message.includes('at least 8 characters')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else {
          setError(e.message);
        }

      } else if (e instanceof Error) {

        // Extract meaningful error message from API error response
        const errorMessage = e.message.includes('HTTP') 
          ? e.message.split(':').slice(1).join(':').trim() || e.message
          : e.message;
        
        // Handle specific error cases with better UX
        if (errorMessage.includes('User already exists') || errorMessage.includes('already in use')) {
          setError('This email is already registered. Try logging in instead?');
        } else if (errorMessage.includes('too weak') || errorMessage.includes('at least 8 characters')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else {
          setError(errorMessage || "We couldn't create your account. Try again?");
        }

      } else {

        setError("We couldn't create your account. Try again?");

      }

      setShake(true);

      setTimeout(() => setShake(false), 400);

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className={`relative min-h-screen overflow-hidden ${theme === "dark" ? "bg-[#0b0614]" : "bg-[#f6f6f8]"}`}>

      {theme === "dark" && (

        <div className="absolute inset-0 bg-gradient-to-br from-[#840A36] via-[#2a0f1d] to-[#0b0614]" />

      )}



      {theme === "dark" && (

        <>

          <div className="absolute top-[-140px] left-[-140px] h-[520px] w-[520px] rounded-full bg-[#840A36]/30 blur-[170px]" />

          <div className="absolute bottom-[-160px] right-[-160px] h-[520px] w-[520px] rounded-full bg-[#840A36]/20 blur-[170px]" />

        </>

      )}



      {/* Dark Mode Toggle */}

      <button

        onClick={toggleTheme}

        className={`fixed top-6 right-6 z-50 rounded-full p-3 backdrop-blur-md border transition-all duration-300 ${theme === "dark" ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"}`}

        aria-label="Toggle dark mode"

      >

        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}

      </button>



      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">

        <div className={`relative w-full max-w-[1240px] overflow-hidden rounded-[32px] backdrop-blur-xl border shadow-2xl ${theme === "dark" ? "bg-white/10 border-white/20" : "bg-white border-[#e7e9ef]"}`}>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr]">

            <div className="relative p-6 sm:p-8 lg:p-10">

              <LeftSideHero className="min-h-[640px] rounded-[28px]" />

            </div>



            <section className="relative flex items-center justify-center p-6 sm:p-10 lg:p-12">

              <div className="relative z-10 w-full max-w-[440px]">

                <div className="mb-8">

                  <h2 className={`text-[44px] font-bold ${theme === "dark" ? "text-white" : "text-[#242933]"}`}>Create Account 🚀</h2>

                  <p className={`mt-2 text-[18px] ${theme === "dark" ? "text-gray-300" : "text-[#5f6674]"}`}>Join D-Fluency CRM and start managing your leads efficiently.</p>

                  <div className={`mt-4 p-4 rounded-2xl backdrop-blur-md border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-[#f7f8fb] border-[#e4e6ec]"}`}>

                    <p className={`text-[13px] ${theme === "dark" ? "text-gray-400" : "text-[#6b7280]"}`}>

                      <span className={`font-semibold ${theme === "dark" ? "text-[#f5c6d7]" : "text-[#840A36]"}`}>✨ Getting Started:</span> Fill in your details below. Your password should be secure (8+ chars with uppercase, lowercase, numbers, and special characters).

                    </p>

                  </div>

                </div>



                <div

                  className={`relative rounded-2xl backdrop-blur-xl border shadow-2xl p-8 transition-all duration-500 hover:scale-[1.01] ${theme === "dark" ? "bg-white/10 border-white/20 hover:bg-white/15" : "bg-[#f7f8fb] border-[#e4e6ec] hover:bg-[#f0f1f4]"} ${shake ? "animate-shake" : ""}`}

                >

                  {/* Success Overlay */}

                  {success && (

                    <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-xl rounded-2xl animate-fadeIn z-20 ${theme === "dark" ? "bg-[#0b0614]/85" : "bg-white/90"}`}>

                      <div className="text-green-400 text-6xl mb-4 animate-bounce">✅</div>

                      <p className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>You're all set! 🎉</p>

                      <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Taking you to your dashboard...</p>

                    </div>

                  )}



                  <form className="space-y-5" onSubmit={handleSubmit}>

                    {error ? (

                      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-[14px] font-semibold text-red-300 animate-fadeIn">

                        {error}

                      </div>

                    ) : null}



                  <label className="block space-y-2">

                    <span className={`text-[14px] font-semibold ${theme === "dark" ? "text-gray-200" : "text-[#2f3440]"}`}>Full Name</span>

                    <div className="relative group">

                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === "dark" ? "text-gray-400 group-focus-within:text-[#840A36]" : "text-[#a5a9b5] group-focus-within:text-[#840A36]"}`} size={20} />

                      <input

                        type="text"

                        value={name}

                        onChange={(e) => setName(e.target.value)}

                        placeholder="John Smith"

                        className={`h-[56px] w-full rounded-2xl border pl-12 pr-4 text-[16px] outline-none transition-all ${theme === "dark" ? "border-white/10 bg-white/5 backdrop-blur-sm placeholder:text-gray-500 text-white focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20" : "border-[#e4e6ec] bg-[#f7f8fb] placeholder:text-[#b2b6c2] text-[#313744] focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20"}`}

                      />

                    </div>

                  </label>



                  <label className="block space-y-2">

                    <span className={`text-[14px] font-semibold ${theme === "dark" ? "text-gray-200" : "text-[#2f3440]"}`}>Email Address</span>

                    <div className="relative group">

                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === "dark" ? "text-gray-400 group-focus-within:text-[#840A36]" : "text-[#a5a9b5] group-focus-within:text-[#840A36]"}`} size={20} />

                      <input

                        type="email"

                        value={email}

                        onChange={(e) => setEmail(e.target.value)}

                        placeholder="name@company.com"

                        className={`h-[56px] w-full rounded-2xl border pl-12 pr-4 text-[16px] outline-none transition-all ${theme === "dark" ? "border-white/10 bg-white/5 backdrop-blur-sm placeholder:text-gray-500 text-white focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20" : "border-[#e4e6ec] bg-[#f7f8fb] placeholder:text-[#b2b6c2] text-[#313744] focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20"}`}

                      />

                    </div>

                  </label>



                  <label className="block space-y-2">

                    <span className={`text-[14px] font-semibold ${theme === "dark" ? "text-gray-200" : "text-[#2f3440]"}`}>Password</span>

                    <div className="relative group">

                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === "dark" ? "text-gray-400 group-focus-within:text-[#f5c6d7]" : "text-[#a5a9b5] group-focus-within:text-[#840A36]"}`} size={20} />

                      <input

                        type={showPassword ? "text" : "password"}

                        value={password}

                        onChange={(e) => setPassword(e.target.value)}

                        placeholder="••••••••"

                        className={`h-[56px] w-full rounded-2xl border pl-12 pr-12 text-[16px] outline-none transition-all ${theme === "dark" ? "border-white/10 bg-white/5 backdrop-blur-sm placeholder:text-gray-500 text-white focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20" : "border-[#e4e6ec] bg-[#f7f8fb] placeholder:text-[#b2b6c2] text-[#313744] focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20"}`}

                      />

                      <button

                        type="button"

                        aria-label={showPassword ? "Hide password" : "Show password"}

                        onClick={() => setShowPassword((prev) => !prev)}

                        className={`absolute right-3 top-1/2 z-30 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer ${theme === "dark" ? "text-gray-400 hover:text-[#f5c6d7] hover:bg-white/10" : "text-[#a5a9b5] hover:text-[#840A36] hover:bg-gray-100"}`}

                      >

                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                      </button>

                    </div>

                    <div className={`text-[12px] ${theme === "dark" ? "text-gray-400" : "text-[#6b7280]"}`}>

                      Must contain: 8+ chars, uppercase, lowercase, number, special char (@$!%*?&)

                    </div>

                  </label>



                  <label className="block space-y-2">

                    <span className={`text-[14px] font-semibold ${theme === "dark" ? "text-gray-200" : "text-[#2f3440]"}`}>Confirm Password</span>

                    <div className="relative group">

                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === "dark" ? "text-gray-400 group-focus-within:text-[#f5c6d7]" : "text-[#a5a9b5] group-focus-within:text-[#840A36]"}`} size={20} />

                      <input

                        type={showConfirmPassword ? "text" : "password"}

                        value={confirmPassword}

                        onChange={(e) => setConfirmPassword(e.target.value)}

                        placeholder="••••••••"

                        className={`h-[56px] w-full rounded-2xl border pl-12 pr-12 text-[16px] outline-none transition-all ${theme === "dark" ? "border-white/10 bg-white/5 backdrop-blur-sm placeholder:text-gray-500 text-white focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20" : "border-[#e4e6ec] bg-[#f7f8fb] placeholder:text-[#b2b6c2] text-[#313744] focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20"}`}

                      />

                      <button

                        type="button"

                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}

                        onClick={() => setShowConfirmPassword((prev) => !prev)}

                        className={`absolute right-3 top-1/2 z-30 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer ${theme === "dark" ? "text-gray-400 hover:text-[#f5c6d7] hover:bg-white/10" : "text-[#a5a9b5] hover:text-[#840A36] hover:bg-gray-100"}`}

                      >

                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                      </button>

                    </div>

                  </label>



                  <button

                    type="submit"

                    disabled={loading}

                    className="block h-[56px] w-full rounded-2xl bg-gradient-to-r from-[#840A36] to-[#5a0725] text-center text-[16px] font-semibold leading-[56px] text-white shadow-2xl hover:shadow-[#840A36]/25 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"

                  >

                    {loading ? (

                      <>

                        <span className="loader"></span>

                        Creating Account...

                      </>

                    ) : (

                      "Create Account"

                    )}

                  </button>



                  <p className={`text-center text-[14px] ${theme === "dark" ? "text-gray-300" : "text-[#6b7280]"}`}>

                    Already have an account?{" "}

                    <Link href="/login" className={`font-semibold transition-colors ${theme === "dark" ? "text-[#f5c6d7] hover:text-white" : "text-[#840A36] hover:text-[#5a0725]"}`}>

                      Sign In

                    </Link>

                  </p>

                </form>

                </div>



                <div className={`mt-8 flex justify-center gap-8 text-[12px] uppercase tracking-wide ${theme === "dark" ? "text-gray-500" : "text-[#9ca3af]"}`}>

                  <button type="button" className={`transition-colors ${theme === "dark" ? "hover:text-gray-300" : "hover:text-[#6b7280]"}`}>Privacy Policy</button>

                  <button type="button" className={`transition-colors ${theme === "dark" ? "hover:text-gray-300" : "hover:text-[#6b7280]"}`}>Terms of Service</button>

                  <button type="button" className={`transition-colors ${theme === "dark" ? "hover:text-gray-300" : "hover:text-[#6b7280]"}`}>Help Center</button>

                </div>

              </div>

            </section>

          </div>

        </div>

      </div>

    </div>

  );

}

