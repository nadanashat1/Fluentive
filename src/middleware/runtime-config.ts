// Runtime Configuration for Production
// Heavy DB routes use Node.js, lightweight routes use Edge

export const RUNTIME_CONFIG = {
  // Heavy database operations (admin, analytics, AI insights)
  heavy: 'nodejs' as const,
  
  // Lightweight operations (health, notifications, auth)
  lightweight: 'edge' as const,
  
  // Cache duration in seconds
  cache: {
    short: 300,    // 5 minutes
    medium: 1800,  // 30 minutes
    long: 3600     // 1 hour
  }
};

export function getRuntime(routeType: 'heavy' | 'lightweight'): string {
  return RUNTIME_CONFIG[routeType];
}
