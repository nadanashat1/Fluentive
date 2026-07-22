"use client";



import { useEffect, useRef, useState } from "react";



type LeftSideHeroProps = {

  className?: string;

};



export default function LeftSideHero({ className }: LeftSideHeroProps) {

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    // Loading animation

    const timer = setTimeout(() => setIsLoading(false), 800);

    return () => clearTimeout(timer);

  }, []);



  useEffect(() => {

    // Mouse parallax effect

    const handleMouseMove = (e: MouseEvent) => {

      if (containerRef.current) {

        const rect = containerRef.current.getBoundingClientRect();

        const x = (e.clientX - rect.left) / rect.width - 0.5;

        const y = (e.clientY - rect.top) / rect.height - 0.5;

        setMousePosition({ x, y });

      }

    };



    const container = containerRef.current;

    if (container) {

      container.addEventListener('mousemove', handleMouseMove);

      return () => container.removeEventListener('mousemove', handleMouseMove);

    }

  }, []);



  return (

    <div 

      ref={containerRef}

      className={`relative h-full w-full flex items-center overflow-hidden bg-[#1a0b2e] transition-opacity duration-700 ${isLoading ? "opacity-0" : "opacity-100"} ${className ?? ""}`}

    >



      {/* 🔥 Animated Gradient Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-[#840A36] via-[#2a0f1d] to-[#0b0614] animate-gradient-shift">

        <style jsx>{`

          @keyframes gradient-shift {

            0%, 100% { background-position: 0% 50%; }

            50% { background-position: 100% 50%; }

          }

          .animate-gradient-shift {

            background-size: 200% 200%;

            animation: gradient-shift 8s ease infinite;

          }

        `}</style>

      </div>



      {/* 💡 Glow Effects with Parallax */}

      <div 

        className="absolute top-[-120px] left-[-140px] w-[420px] h-[420px] bg-[#840A36]/35 blur-[160px] rounded-full transition-transform duration-300 ease-out"

        style={{

          transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`

        }}

      />

      <div 

        className="absolute bottom-[-140px] right-[-120px] w-[380px] h-[380px] bg-[#840A36]/25 blur-[160px] rounded-full transition-transform duration-300 ease-out"

        style={{

          transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`

        }}

      />



      {/* ✨ Animated Particles */}

      <div className="absolute inset-0 opacity-30">

        <div className="w-full h-full bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse"></div>

      </div>



      {/* 🌊 Gradient Waves */}

      <div className="absolute inset-0 opacity-20">

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#840A36]/25 to-transparent animate-wave">

          <style jsx>{`

            @keyframes wave {

              0%, 100% { transform: translateX(0) translateY(0); }

              50% { transform: translateX(-25px) translateY(5px); }

            }

            .animate-wave {

              animation: wave 4s ease-in-out infinite;

            }

          `}</style>

        </div>

      </div>



      {/* 📦 Content with 3D Tilt */}

      <div 

        className="relative z-10 max-w-2xl text-white transition-transform duration-300 ease-out px-4"

        style={{

          transform: `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * -5}deg)`

        }}

      >



        {/* Logo */}

        <div className="flex items-center gap-3 mb-8">

          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#840A36] to-[#5a0725] animate-logo-glow">

            <style jsx>{`

              @keyframes logo-glow {

                0%, 100% { box-shadow: 0 0 20px rgba(132, 10, 54, 0.5); }

                50% { box-shadow: 0 0 40px rgba(132, 10, 54, 0.8); }

              }

              .animate-logo-glow {

                animation: logo-glow 2s ease-in-out infinite;

              }

            `}</style>

          </div>

          <span className="text-lg font-medium text-gray-300">

            D fluency CRM

          </span>

        </div>



        {/* Title with Shimmer */}

        <h1 className="text-6xl font-bold leading-tight mb-6">

          Manage your{" "}

          <span className="bg-gradient-to-r from-[#840A36] via-[#f5c6d7] to-[#840A36] bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">

            learning empire

          </span>{" "}

          in one place.

          <style jsx>{`

            @keyframes shimmer {

              0% { background-position: 200% 0; }

              100% { background-position: -200% 0; }

            }

            .animate-shimmer {

              animation: shimmer 3s linear infinite;

            }

          `}</style>

        </h1>



        {/* 💎 Glass Box with 3D Tilt */}

        <div 

          className="relative mt-10 mx-2 p-[1px] rounded-2xl bg-gradient-to-br from-purple-500/40 via-purple-600/30 to-transparent transition-transform duration-300 ease-out"

          style={{

            transform: `perspective(1000px) rotateX(${mousePosition.y * 3}deg) rotateY(${mousePosition.x * -3}deg)`

          }}

        >

          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-14 transition-all duration-500 hover:scale-[1.02] hover:bg-white/15">

            <p className="text-gray-300 text-lg leading-relaxed px-8 py-6">

              The all-in-one platform for creators to build, market, and sell

              online courses with powerful automation.

            </p>

          </div>

        </div>



      </div>

    </div>

  );

}

