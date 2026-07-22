"use client";

import { useEffect } from 'react';
import { useSilentRefresh } from '@/hooks/useSilentRefresh';

interface SilentRefreshWrapperProps {
  children: React.ReactNode;
}

export function SilentRefreshWrapper({ children }: SilentRefreshWrapperProps) {
  // ✅ DISABLED: Auto-refresh completely disabled to prevent loops
  // This component now just renders children without any refresh logic
  
  return <>{children}</>;
}
