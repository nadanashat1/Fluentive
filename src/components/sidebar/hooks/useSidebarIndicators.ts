"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface SidebarIndicatorsReturn {
  indicatorY: number;
  setIndicatorY: (y: number) => void;
  isTransitioning: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useSidebarIndicators(): SidebarIndicatorsReturn {
  const pathname = usePathname();
  const [indicatorY, setIndicatorY] = useState(0);
  const [prevPath, setPrevPath] = useState(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  // Route transition detection
  useEffect(() => {
    setPrevPath(pathname);
  }, [pathname]);

  const isTransitioning = prevPath !== pathname;

  // Smooth indicator update based on active route
  const updateIndicatorPosition = useCallback(() => {
    if (!containerRef.current) return;
    
    // Find active item by href matching
    const activeItem = containerRef.current.querySelector(
      `[data-active="true"]`
    ) as HTMLElement;
    
    if (activeItem) {
      const itemTop = activeItem.offsetTop;
      setIndicatorY(itemTop);
    }
  }, []);

  // Update on mount and route change
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timeout = setTimeout(updateIndicatorPosition, 50);
    return () => clearTimeout(timeout);
  }, [pathname, updateIndicatorPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateIndicatorPosition();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateIndicatorPosition]);

  return {
    indicatorY,
    setIndicatorY,
    isTransitioning,
    containerRef,
  };
}
