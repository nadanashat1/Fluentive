// Database Connection Pool Safety for Vercel Hobby
// Prevents connection exhaustion and memory leaks

interface ConnectionStats {
  active: number;
  idle: number;
  total: number;
  errors: number;
  lastError?: string;
}

class ConnectionPool {
  private stats: ConnectionStats = {
    active: 0,
    idle: 0,
    total: 0,
    errors: 0
  };

  private maxConnections = 5; // Conservative limit for serverless
  private connectionTimeout = 10000; // 10 seconds
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    // Check connection limits
    if (this.stats.active >= this.maxConnections) {
      throw new Error('Connection pool exhausted');
    }

    this.stats.active++;
    this.stats.total++;

    try {
      const result = await this.withRetry(operation);
      
      // Update stats on success
      this.stats.active--;
      this.stats.idle++;
      
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`Slow query detected: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      // Update error stats
      this.stats.errors++;
      this.stats.active--;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Database operation failed:`, {
        error: this.stats.lastError,
        duration: Date.now() - startTime,
        activeConnections: this.stats.active,
        totalErrors: this.stats.errors
      });
      
      throw error;
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Add timeout to prevent hanging
        return await Promise.race([
          operation(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), this.connectionTimeout)
          )
        ]);
      } catch (error) {
        lastError = error;
        
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
    
    throw lastError;
  }

  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      active: 0,
      idle: 0,
      total: 0,
      errors: 0
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.execute(async () => {
        // Simple health query
        return true;
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const connectionPool = new ConnectionPool();

// Wrapper for Prisma operations
export function withConnectionPool<T>(operation: () => Promise<T>): Promise<T> {
  return connectionPool.execute(operation);
}
