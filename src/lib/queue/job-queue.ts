// Job queue system for production SaaS architecture
import { EventEmitter } from 'events';

interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

export class JobQueue {
  private static instance: JobQueue;
  private jobs: Job[] = [];
  private processing = false;
  private eventEmitter = new EventEmitter();

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  // Add job to queue
  async add(type: string, data: any, priority = 1): Promise<string> {
    const job: Job = {
      id: crypto.randomUUID(),
      type,
      data,
      priority,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.jobs.push(job);
    this.jobs.sort((a, b) => b.priority - a.priority);
    
    this.eventEmitter.emit('jobAdded', job);
    
    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }

    return job.id;
  }

  // Process jobs
  private async process(): Promise<void> {
    if (this.processing || this.jobs.length === 0) return;
    
    this.processing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift()!;
      
      try {
        await this.executeJob(job);
        this.eventEmitter.emit('jobCompleted', job);
      } catch (error) {
        job.attempts++;
        this.eventEmitter.emit('jobFailed', job, error);
        
        if (job.attempts < job.maxAttempts) {
          // Retry job
          this.jobs.push(job);
          this.jobs.sort((a, b) => b.priority - a.priority);
        } else {
          this.eventEmitter.emit('jobMaxAttemptsReached', job);
        }
      }
    }

    this.processing = false;
  }

  // Execute individual job
  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'SEND_EMAIL':
        await this.sendEmail(job.data);
        break;
      case 'PROCESS_LEAD_SCORE':
        await this.processLeadScore(job.data);
        break;
      case 'CACHE_INVALIDATION':
        await this.processCacheInvalidation(job.data);
        break;
      case 'ANALYTICS_UPDATE':
        await this.processAnalyticsUpdate(job.data);
        break;
      default:
        console.warn(`Unknown job type: ${job.type}`);
    }
  }

  // Job handlers
  private async sendEmail(data: any): Promise<void> {
    console.log('Sending email:', data);
    // Email sending logic here
  }

  private async processLeadScore(data: any): Promise<void> {
    console.log('Processing lead score:', data);
    // Lead scoring logic here
  }

  private async processCacheInvalidation(data: any): Promise<void> {
    console.log('Processing cache invalidation:', data);
    // Cache invalidation logic here
  }

  private async processAnalyticsUpdate(data: any): Promise<void> {
    console.log('Processing analytics update:', data);
    // Analytics update logic here
  }

  // Event listeners
  on(event: 'jobAdded' | 'jobCompleted' | 'jobFailed' | 'jobMaxAttemptsReached', listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }

  // Get queue status
  getStatus(): { pending: number; processing: boolean; totalProcessed: number } {
    return {
      pending: this.jobs.length,
      processing: this.processing,
      totalProcessed: this.eventEmitter.listenerCount('jobCompleted'),
    };
  }
}

// Export singleton instance
export const jobQueue = JobQueue.getInstance();
