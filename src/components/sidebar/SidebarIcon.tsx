"use client";

import { Building2, LayoutDashboard, Users, Settings, Activity, Brain, BookOpen, Book, GraduationCap, Target, Megaphone } from "lucide-react";
import clsx from "clsx";
import { sidebarMotion, getIconAnimationType } from "./sidebar.motion";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Icon mapping - single source of truth for sidebar icons
const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={16} />,
  Leads: <Users size={16} />,
  "AI Analytics": <Brain size={16} />,
  "Sales Pipeline": <Users size={16} />,
  Courses: <Book size={16} />,
  Instructors: <GraduationCap size={16} />,
  "Sales Team": <Target size={16} />,
  Marketing: <Megaphone size={16} />,
  HR: <Users size={16} />,
  Finance: <Building2 size={16} />,
  Settings: <Settings size={16} />,
  "Activity Logs": <Activity size={16} />,
  Users: <Users size={16} />
};

interface SidebarIconProps {
  label: string;
}

export function SidebarIcon({ label }: SidebarIconProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const animationType = getIconAnimationType(label);
  const variants = sidebarMotion.iconVariants[animationType];
  const isBook = animationType === "book";

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleClick = () => {
    if (isBook && !prefersReducedMotion) {
      setShowGif(true);
      setTimeout(() => setShowGif(false), 2000);
    }
  };

  // Fallback to CSS-only animation for reduced motion
  if (prefersReducedMotion) {
    return (
      <span className={clsx("relative z-10", sidebarMotion.iconFallback)}>
        {iconMap[label]}
      </span>
    );
  }

  return (
    <motion.span
      className="relative z-10"
      initial={false}
      whileHover="hover"
      whileTap="tap"
      variants={variants}
      onClick={handleClick}
      style={{
        // GPU-optimized properties only
        willChange: "transform",
        transformStyle: "preserve-3d",
        transformOrigin: isBook ? "right center" : "center center",
      }}
    >
      {isBook && showGif ? (
        <img
          src="https://img.icons8.com/color/48/open-book.png"
          alt="Open Book"
          className="w-4 h-4"
          style={{ width: 16, height: 16 }}
        />
      ) : (
        iconMap[label]
      )}
    </motion.span>
  );
}
