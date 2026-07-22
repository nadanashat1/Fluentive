import React from "react";

export function AddDealCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#ececef] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      {children}
    </div>
  );
}
