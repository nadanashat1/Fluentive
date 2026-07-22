"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion as framerMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { NavIntent, NAV_ITEM_STYLES, getIntentStyles } from "@/lib/navigation-config";
import { SidebarIcon } from "./SidebarIcon";

interface SidebarItemProps {
  href: string;
  label: string;
  collapsed: boolean;
  onActive: (top: number) => void;
  isTransitioning: boolean;
  mouseY: number;
  index: number;
  isNavigating: boolean;
  direction: number;
}

export function SidebarItem({
  href,
  label,
  collapsed,
  onActive,
  isTransitioning,
  mouseY,
  index,
  isNavigating,
  direction,
}: SidebarItemProps) {
  const pathname = usePathname();
  const active = href !== "#" && pathname.startsWith(href);
  const ref = useRef<HTMLAnchorElement>(null);
  const [hoverScale, setHoverScale] = useState(1);
  const isBook = label === "Courses";
  
  // Determine intent state
  const intent: NavIntent = isTransitioning ? "transitioning" : active ? "active" : "idle";
  const intentStyles = getIntentStyles(intent);

  useEffect(() => {
    if (active && ref.current) {
      const itemTop = ref.current.offsetTop;
      onActive(itemTop);
    }
  }, [active, onActive]);

  // Predictive hover - proximity-based scaling (throttled for performance)
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(mouseY - centerY);
      const scale = Math.max(1, 1.05 - distance / 600);
      setHoverScale(scale);
    }
  }, [mouseY]);

  return (
    <framerMotion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link
        ref={ref}
        href={href}
        style={{
          transform: `scale(${hoverScale}) translateY(${direction * 0.02}px)`,
          transition: "transform 150ms ease-out",
          perspective: "1000px",
        }}
        className={clsx(
          NAV_ITEM_STYLES.base,
          collapsed ? "justify-center px-2" : "",
          intentStyles,
          NAV_ITEM_STYLES.press,
          isNavigating && "opacity-70 scale-[0.98]"
        )}
      >
        {/* icon */}
        <SidebarIcon label={label} />

        {/* label */}
        {!collapsed && (
          <span className={clsx("relative z-10", NAV_ITEM_STYLES.label)}>
            {label}
          </span>
        )}

        {/* tooltip when collapsed */}
        {collapsed && (
          <span className="absolute left-14 hidden group-hover:block rounded-md bg-black px-2 py-1 text-xs text-white whitespace-nowrap z-50">
            {label}
          </span>
        )}
      </Link>
    </framerMotion.div>
  );
}
