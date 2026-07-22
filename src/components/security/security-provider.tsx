"use client";

import { useEffect } from "react";
import { initSecurityMonitoring } from "@/lib/security-monitor";
import { useUser } from "@/contexts/user-context";

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      initSecurityMonitoring({
        id: user.id,
        email: user.email
      });
    }
  }, [user]);

  return <>{children}</>;
}
