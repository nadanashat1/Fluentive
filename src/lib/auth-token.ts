// Backwards-compatible helper for legacy components that still send Bearer tokens.
// New auth uses httpOnly cookies; these tokens may be absent in production.

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("dfluency.token") ||
    ""
  );
}

