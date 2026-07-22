"use client";

import { createContext, useContext } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string | null;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  error: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

import { useAuth } from "@/contexts/AuthContext-production";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, state } = useAuth();
  const error = state.status === 'error';

  return (
    <UserContext.Provider value={{ user, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("Hey, useUser needs to be inside a UserProvider!");
  }
  return context;
}
