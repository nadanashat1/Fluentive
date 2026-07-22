// Timeout Guard for Vercel Hobby
// Kills long-running queries before they exceed memory limits

interface TimeoutConfig {
  maxDuration: number;
  errorMessage: string;
}

export const TIMEOUTS: Record<string, TimeoutConfig> = {
  default: { maxDuration: 4000, errorMessage: 'Query timeout - operation took too long' },
  analytics: { maxDuration: 3000, errorMessage: 'Analytics query timeout - exceeded time limit' },
  ai: { maxDuration: 5000, errorMessage: 'AI processing timeout - model took too long' },
  realtime: { maxDuration: 2000, errorMessage: 'Realtime query timeout - operation too slow' }
};

export function withTimeout<T>(
  promise: Promise<T>,
  config: TimeoutConfig = TIMEOUTS.default,
  customTimeout?: number
): Promise<T> {
  const timeout = customTimeout || config.maxDuration;
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(config.errorMessage));
    }, timeout);
    
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
