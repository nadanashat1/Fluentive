// Query Logger for Vercel Hobby
// Tracks failed queries and performance issues

interface QueryLog {
  timestamp: string;
  operation: string;
  duration: number;
  error?: string;
  memoryUsage?: number;
  connectionId?: string;
}

class QueryLogger {
  private logs: QueryLog[] = [];
  private maxLogs = 100; // Prevent memory leaks
  private slowQueryThreshold = 2000; // 2 seconds

  log(operation: string, duration: number, error?: string, memoryUsage?: number): void {
    const log: QueryLog = {
      timestamp: new Date().toISOString(),
      operation,
      duration,
      error,
      memoryUsage,
      connectionId: this.generateConnectionId()
    };

    this.logs.push(log);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`[SLOW QUERY] ${operation}: ${duration}ms`);
    }

    // Log errors
    if (error) {
      console.error(`[QUERY ERROR] ${operation}: ${error}`);
    }
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getStats() {
    const stats = {
      totalQueries: this.logs.length,
      errorCount: this.logs.filter(log => log.error).length,
      slowQueryCount: this.logs.filter(log => log.duration > this.slowQueryThreshold).length,
      averageDuration: this.logs.reduce((sum, log) => sum + log.duration, 0) / this.logs.length,
      memoryUsage: this.logs.reduce((sum, log) => sum + (log.memoryUsage || 0), 0) / this.logs.length
    };

    return stats;
  }

  getRecentErrors(limit: number = 10): QueryLog[] {
    return this.logs
      .filter(log => log.error)
      .slice(-limit);
  }

  clear(): void {
    this.logs = [];
  }

  // Export logs for monitoring
  exportLogs(): QueryLog[] {
    return [...this.logs];
  }
}

export const queryLogger = new QueryLogger();

// Wrapper for logging database operations
export async function withQueryLogging<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    const result = await queryFn();
    
    const duration = Date.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed - startMemory;
    
    queryLogger.log(operation, duration, undefined, memoryUsage);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed - startMemory;
    
    queryLogger.log(
      operation, 
      duration, 
      error instanceof Error ? error.message : 'Unknown error',
      memoryUsage
    );
    
    throw error;
  }
}
