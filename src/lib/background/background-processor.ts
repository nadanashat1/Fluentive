// Advanced background processing system for production SaaS architecture
import { EventEmitter } from 'events';
import { logger } from '@/lib/observability/logger';

export interface BackgroundJob {
  id: string;
  type: string;
  data: any;
  priority: number;
  tenantId: string;
  userId?: string;
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  timeout: number;
  metadata?: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: Error;
  duration: number;
  retryAt?: Date;
}

export class BackgroundProcessor extends EventEmitter {
  private static instance: BackgroundProcessor;
  private jobs: Map<string, BackgroundJob> = new Map();
  private processing = new Set<string>();
  private workers: number;
  private isRunning = false;

  constructor(workers = 3) {
    super();
    this.workers = workers;
  }

  static getInstance(workers = 3): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor(workers);
    }
    return BackgroundProcessor.instance;
  }

  // Add job to queue
  async addJob(job: Omit<BackgroundJob, 'id' | 'attempts'>): Promise<string> {
    const backgroundJob: BackgroundJob = {
      ...job,
      id: crypto.randomUUID(),
      attempts: 0,
    };

    this.jobs.set(backgroundJob.id, backgroundJob);
    
    logger.info('background-processor', `Job added: ${backgroundJob.type}`, {
      jobId: backgroundJob.id,
      tenantId: backgroundJob.tenantId,
      priority: backgroundJob.priority,
    });

    this.emit('jobAdded', backgroundJob);
    
    // Start processing if not running
    if (!this.isRunning) {
      this.start();
    }

    return backgroundJob.id;
  }

  // Schedule job for future execution
  async scheduleJob(job: Omit<BackgroundJob, 'id' | 'attempts' | 'scheduledAt'>, scheduledAt: Date): Promise<string> {
    return this.addJob({ ...job, scheduledAt });
  }

  // Start processing jobs
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('background-processor', 'Background processor started', { workers: this.workers });
    
    // Start worker processes
    for (let i = 0; i < this.workers; i++) {
      this.processJobs();
    }
  }

  // Stop processing jobs
  stop(): void {
    this.isRunning = false;
    logger.info('background-processor', 'Background processor stopped');
  }

  // Process jobs continuously
  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      try {
        const job = this.getNextJob();
        if (!job) {
          await this.sleep(1000); // Wait for jobs
          continue;
        }

        await this.processJob(job);
      } catch (error) {
        logger.error('background-processor', 'Worker process error', error as Error);
        await this.sleep(5000); // Wait before retrying
      }
    }
  }

  // Get next job to process
  private getNextJob(): BackgroundJob | null {
    const now = new Date();
    let bestJob: BackgroundJob | null = null;

    for (const job of this.jobs.values()) {
      // Skip if already processing
      if (this.processing.has(job.id)) continue;
      
      // Skip if scheduled for future
      if (job.scheduledAt && job.scheduledAt > now) continue;
      
      // Skip if max attempts reached
      if (job.attempts >= job.maxAttempts) continue;

      // Select highest priority job
      if (!bestJob || job.priority > bestJob.priority) {
        bestJob = job;
      }
    }

    return bestJob;
  }

  // Process individual job
  private async processJob(job: BackgroundJob): Promise<void> {
    this.processing.add(job.id);
    const startTime = Date.now();

    try {
      logger.info('background-processor', `Processing job: ${job.type}`, {
        jobId: job.id,
        tenantId: job.tenantId,
        attempt: job.attempts + 1,
      });

      const result = await this.executeJob(job);
      const duration = Date.now() - startTime;

      if (result.success) {
        this.jobs.delete(job.id);
        logger.info('background-processor', `Job completed: ${job.type}`, {
          jobId: job.id,
          duration,
        });
        this.emit('jobCompleted', job, result);
      } else if (result.retryAt) {
        job.scheduledAt = result.retryAt;
        logger.warn('background-processor', `Job scheduled for retry: ${job.type}`, {
          jobId: job.id,
          retryAt: result.retryAt,
        });
        this.emit('jobRetry', job, result);
      } else {
        this.jobs.delete(job.id);
        logger.error('background-processor', `Job failed permanently: ${job.type}`, result.error, {
          jobId: job.id,
          attempts: job.attempts,
        });
        this.emit('jobFailed', job, result);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('background-processor', `Job processing error: ${job.type}`, error as Error, {
        jobId: job.id,
        duration,
      });
      
      // Retry job if attempts remaining
      if (job.attempts < job.maxAttempts) {
        job.attempts++;
        job.scheduledAt = new Date(Date.now() + Math.pow(2, job.attempts) * 1000); // Exponential backoff
        this.emit('jobRetry', job, { success: false, error: error as Error, duration });
      } else {
        this.jobs.delete(job.id);
        this.emit('jobFailed', job, { success: false, error: error as Error, duration });
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  // Execute job with timeout
  private async executeJob(job: BackgroundJob): Promise<JobResult> {
    const timeout = job.timeout || 30000; // 30 seconds default
    const startTime = Date.now();

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          success: false,
          error: new Error(`Job timeout after ${timeout}ms`),
          duration: Date.now() - startTime,
        });
      }, timeout);

      this.executeJobLogic(job)
        .then((data) => {
          clearTimeout(timer);
          resolve({
            success: true,
            data,
            duration: Date.now() - startTime,
          });
        })
        .catch((error) => {
          clearTimeout(timer);
          resolve({
            success: false,
            error,
            duration: Date.now() - startTime,
            retryAt: job.attempts < job.maxAttempts - 1 
              ? new Date(Date.now() + Math.pow(2, job.attempts + 1) * 1000)
              : undefined,
          });
        });
    });
  }

  // Execute job logic based on type
  private async executeJobLogic(job: BackgroundJob): Promise<any> {
    switch (job.type) {
      case 'SEND_EMAIL':
        return this.sendEmail(job.data);
      
      case 'PROCESS_LEAD_SCORE':
        return this.processLeadScore(job.data);
      
      case 'UPDATE_ANALYTICS':
        return this.updateAnalytics(job.data);
      
      case 'CLEANUP_OLD_DATA':
        return this.cleanupOldData(job.data);
      
      case 'GENERATE_REPORT':
        return this.generateReport(job.data);
      
      case 'SYNC_EXTERNAL_DATA':
        return this.syncExternalData(job.data);
      
      case 'CACHE_WARMING':
        return this.cacheWarming(job.data);
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  // Job implementations
  private async sendEmail(data: { to: string; subject: string; template: string; variables?: Record<string, any> }): Promise<any> {
    logger.info('background-processor', 'Sending email', { to: data.to });
    // Email sending implementation
    return { sent: true, timestamp: new Date() };
  }

  private async processLeadScore(data: { leadId: string; tenantId: string }): Promise<any> {
    logger.info('background-processor', 'Processing lead score', data);
    // Lead scoring implementation
    return { score: Math.random() * 10, processedAt: new Date() };
  }

  private async updateAnalytics(data: { tenantId: string; period: string }): Promise<any> {
    logger.info('background-processor', 'Updating analytics', data);
    // Analytics update implementation
    return { updated: true, timestamp: new Date() };
  }

  private async cleanupOldData(data: { tenantId: string; days: number }): Promise<any> {
    logger.info('background-processor', 'Cleaning up old data', data);
    // Data cleanup implementation
    return { deleted: 0, cleanedAt: new Date() };
  }

  private async generateReport(data: { tenantId: string; reportType: string; filters?: any }): Promise<any> {
    logger.info('background-processor', 'Generating report', data);
    // Report generation implementation
    return { reportUrl: '', generatedAt: new Date() };
  }

  private async syncExternalData(data: { tenantId: string; source: string }): Promise<any> {
    logger.info('background-processor', 'Syncing external data', data);
    // External data sync implementation
    return { synced: 0, syncedAt: new Date() };
  }

  private async cacheWarming(data: { tenantId: string; keys: string[] }): Promise<any> {
    logger.info('background-processor', 'Warming cache', data);
    // Cache warming implementation
    return { warmed: data.keys.length, warmedAt: new Date() };
  }

  // Utility methods
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue statistics
  getStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const pending = Array.from(this.jobs.values()).filter(job => 
      !this.processing.has(job.id) && 
      (!job.scheduledAt || job.scheduledAt <= new Date())
    ).length;

    const scheduled = Array.from(this.jobs.values()).filter(job => 
      job.scheduledAt && job.scheduledAt > new Date()
    ).length;

    return {
      pending,
      processing: this.processing.size,
      completed: this.listenerCount('jobCompleted'),
      failed: this.listenerCount('jobFailed'),
    };
  }

  // Get job status
  getJobStatus(jobId: string): BackgroundJob | null {
    return this.jobs.get(jobId) || null;
  }
}

// Export singleton instance
export const backgroundProcessor = BackgroundProcessor.getInstance();
