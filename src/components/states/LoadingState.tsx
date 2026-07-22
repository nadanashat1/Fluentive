import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Loading State Component
 * 
 * Reality-First UI: Always show loading state when data is being fetched.
 * Never assume data exists - always wait for confirmation.
 */
export function LoadingState({ message = "Loading...", size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={`animate-spin text-blue-500 ${sizeClasses[size]}`} />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
