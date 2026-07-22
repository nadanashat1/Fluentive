"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { Eye, EyeOff, Lock, Mail, Moon, Sun } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext-production";

import LeftSideHero from "@/components/LeftSideHero";

import { useTheme } from "@/contexts/theme-context";



export default function LoginPage() {

  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const [shake, setShake] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const { login } = useAuth();



  // Clear any stale error state on mount

  useEffect(() => {

    setError(null);

    setShake(false);

  }, []);



  const handleSubmit = async (event: React.FormEvent) => {

    event.preventDefault();

    setError(null);

    setLoading(true);

    setShake(false);



    try {

      await login(email, password);



      setSuccess(true);

      

      // Redirect after success animation

      setTimeout(() => {

        router.push("/dashboard");

      }, 1500);

    } catch (e) {

      if (e instanceof Error) {

        // Extract meaningful error message from API error response
        const errorMessage = e.message.includes('HTTP') 
          ? e.message.split(':').slice(1).join(':').trim() || e.message
          : e.message;
        setError(errorMessage || "We couldn't sign you in. Check your email and password and try again.");

      } else {

        setError("We couldn't sign you in. Check your email and password and try again.");

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

        <div 

          className="absolute inset-0 bg-gradient-to-br from-[#840A36] via-[#2a0f1d] to-[#0b0614]"

          style={{ 

            backfaceVisibility: 'hidden',

            WebkitBackfaceVisibility: 'hidden',

            transform: 'translateZ(0)',

            WebkitTransform: 'translateZ(0)'

          }}

        />

      )}



      {theme === "dark" && (

        <>

          <div 

            className="absolute top-[-140px] left-[-140px] h-[520px] w-[520px] rounded-full bg-[#840A36]/30 blur-[120px]"

            style={{ 

              backfaceVisibility: 'hidden',

              WebkitBackfaceVisibility: 'hidden',

              transform: 'translate3d(0, 0, 0)',

              WebkitTransform: 'translate3d(0, 0, 0)',

              willChange: 'transform'

            }}

          />

          <div 

            className="absolute bottom-[-160px] right-[-160px] h-[520px] w-[520px] rounded-full bg-[#840A36]/20 blur-[120px]"

            style={{ 

              backfaceVisibility: 'hidden',

              WebkitBackfaceVisibility: 'hidden',

              transform: 'translate3d(0, 0, 0)',

              WebkitTransform: 'translate3d(0, 0, 0)',

              willChange: 'transform'

            }}

          />

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

                {/* Success Overlay */}

                {success && (

                  <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-xl rounded-2xl animate-fadeIn z-20 ${theme === "dark" ? "bg-[#0b0614]/85" : "bg-white/90"}`}>

                    <div className="text-green-400 text-6xl mb-4 animate-bounce">✅</div>

                    <p className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>You're in! 🎉</p>

                    <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Taking you to your dashboard...</p>

                  </div>

                )}



                <div className="mb-8">

                  <h2 className={`text-[44px] font-bold ${theme === "dark" ? "text-white" : "text-[#242933]"}`}>Welcome Back! 👋</h2>

                  <p className={`mt-2 text-[18px] ${theme === "dark" ? "text-gray-300" : "text-[#5f6674]"}`}>Enter your credentials to access your dashboard and manage your leads.</p>

                  <div className={`mt-4 p-4 rounded-2xl backdrop-blur-md border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-[#f7f8fb] border-[#e4e6ec]"}`}>

                    <p className={`text-[13px] ${theme === "dark" ? "text-gray-400" : "text-[#6b7280]"}`}>

                      <span className={`font-semibold ${theme === "dark" ? "text-[#f5c6d7]" : "text-[#840A36]"}`}>💡 Tip:</span> Use the email and password you created during registration. Forgot your password? Click the link below.

                    </p>

                  </div>

                </div>



                <form className={`space-y-6 transition-transform duration-300 ${shake ? "animate-shake" : ""}`} onSubmit={handleSubmit} autoComplete="off">

                  {error ? (

                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-[14px] font-semibold text-red-300 animate-fadeIn">

                      {error}

                    </div>

                  ) : null}



                  <label className="block space-y-2">

                    <span className={`text-[14px] font-semibold ${theme === "dark" ? "text-gray-200" : "text-[#2f3440]"}`}>Email Address</span>

                    <div className="relative group">

                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === "dark" ? "text-gray-400 group-focus-within:text-[#840A36]" : "text-[#a5a9b5] group-focus-within:text-[#840A36]"}`} size={20} />

                      <input

                        value={email}

                        onChange={(e) => setEmail(e.target.value)}

                        type="email"

                        autoComplete="email"

                        className={`h-[56px] w-full rounded-2xl border pl-12 pr-4 text-[16px] outline-none transition-all ${theme === "dark" ? "border-white/10 bg-white/5 backdrop-blur-sm placeholder:text-gray-500 text-white focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20" : "border-[#e4e6ec] bg-[#f7f8fb] placeholder:text-[#b2b6c2] text-[#313744] focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20"}`}

                        placeholder="name@company.com"

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

                        autoComplete="current-password"

                        className={`h-[56px] w-full rounded-2xl border pl-12 pr-12 text-[16px] outline-none transition-all ${theme === "dark" ? "border-white/10 bg-white/5 backdrop-blur-sm placeholder:text-gray-400 text-white focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20" : "border-[#e4e6ec] bg-[#f7f8fb] placeholder:text-[#b2b6c2] text-[#313744] focus:border-[#840A36] focus:ring-2 focus:ring-[#840A36]/20"}`}

                        placeholder="••••••••"

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

                  </label>



                  <div className={`flex items-center justify-between p-3 rounded-2xl backdrop-blur-md border hover:transition-all duration-300 ${theme === "dark" ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-[#f7f8fb] border-[#e4e6ec] hover:bg-[#f0f1f4]"}`}>

                    <label className="flex items-center gap-3 cursor-pointer select-none">

                      <div className="relative">

                        <input

                          type="checkbox"

                          checked={rememberMe}

                          onChange={(e) => setRememberMe(e.target.checked)}

                          className={`h-4 w-4 rounded accent-[#840A36] focus:ring-2 focus:ring-[#840A36]/50 transition cursor-pointer ${theme === "dark" ? "border-gray-500" : "border-[#d1d5db]"}`}

                        />

                      </div>

                      <span className={`text-[14px] transition-colors tracking-[0.15em] font-light ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-[#6b7280] hover:text-[#313744]"}`}>

                        REMEMBER ME · 30 DAYS

                      </span>

                    </label>



                    <Link

                      href="/forgot-password"

                      className={`text-[14px] transition-colors font-medium ${theme === "dark" ? "text-[#f5c6d7] hover:text-white" : "text-[#840A36] hover:text-[#5a0725]"}`}

                    >

                      Forgot password?

                    </Link>

                  </div>



                  <button

                    type="submit"

                    disabled={loading}

                    className="block h-[56px] w-full rounded-2xl bg-gradient-to-r from-[#840A36] to-[#5a0725] text-center text-[16px] font-semibold leading-[56px] text-white shadow-2xl hover:shadow-[#840A36]/25 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"

                  >

                    {loading ? (

                      <>

                        <span className="loader"></span>

                        Signing in...

                      </>

                    ) : (

                      "Sign In"

                    )}

                  </button>



                  <p className={`text-center text-[14px] ${theme === "dark" ? "text-gray-300" : "text-[#6b7280]"}`}>

                    Don&apos;t have an account?{" "}

                    <Link href="/register" className={`font-semibold transition-colors ${theme === "dark" ? "text-[#f5c6d7] hover:text-white" : "text-[#840A36] hover:text-[#5a0725]"}`}>

                      Create one

                    </Link>

                  </p>

                </form>



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

