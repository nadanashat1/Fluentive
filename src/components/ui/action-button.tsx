"use client";

import type { ReactNode } from "react";

type ActionButtonProps = {
  className?: string;
  message?: string;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
};

export function ActionButton({
  className,
  message: _message,
  children,
  type = "button",
  onClick,
  disabled = false
}: ActionButtonProps) {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
