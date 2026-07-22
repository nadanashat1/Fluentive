import { RuleResult } from './types';

// Request-level Idempotency - Production-grade Idempotency
export class IdempotencyEngine {
  
  // Generate request fingerprint
  static generateRequestFingerprint(request: {
    method: string;
    url: string;
    userId: string;
    workspaceId: string;
    body: any;
    headers?: Record<string, string>;
  }): string {
    const fingerprintData = {
      method: request.method.toUpperCase(),
      url: request.url.toLowerCase(),
      userId: request.userId,
      workspaceId: request.workspaceId,
      body: this.normalizeBody(request.body),
      timestamp: Math.floor(Date.now() / (1000 * 60)) // 1-minute window
    };

    return this.hashFingerprint(fingerprintData);
  }

  // Validate idempotency key format
  static validateIdempotencyKey(key: string): RuleResult {
    if (!key || key.trim().length === 0) {
      return {
        isValid: false,
        error: 'Idempotency key is required',
        code: 'IDEMPOTENCY_KEY_REQUIRED'
      };
    }

    if (key.length > 255) {
      return {
        isValid: false,
        error: 'Idempotency key too long (max 255 characters)',
        code: 'IDEMPOTENCY_KEY_TOO_LONG'
      };
    }

    // Validate key format (UUID or custom format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const customRegex = /^[a-zA-Z0-9_-]{1,255}$/;
    
    if (!uuidRegex.test(key) && !customRegex.test(key)) {
      return {
        isValid: false,
        error: 'Invalid idempotency key format',
        code: 'INVALID_IDEMPOTENCY_KEY_FORMAT'
      };
    }

    return { isValid: true };
  }

  // Check if request is already processed
  static async checkRequestProcessed(
    fingerprint: string, 
    storage: IdempotencyStorage
  ): Promise<{
    processed: boolean;
    response?: any;
    error?: string;
  }> {
    try {
      const stored = await storage.get(fingerprint);
      
      if (!stored) {
        return { processed: false };
      }

      // Check if request is still being processed
      if (stored.status === 'processing' && 
          Date.now() - stored.timestamp < 30000) { // 30 seconds timeout
        return {
          processed: true,
          error: 'Request is still being processed'
        };
      }

      // Return cached response if completed
      if (stored.status === 'completed') {
        return {
          processed: true,
          response: stored.response
        };
      }

      // Clean up stale processing requests
      if (stored.status === 'processing' && 
          Date.now() - stored.timestamp >= 30000) {
        await storage.delete(fingerprint);
        return { processed: false };
      }

      return { processed: false };
    } catch (error) {
      return {
        processed: false,
        error: 'Failed to check idempotency'
      };
    }
  }

  // Mark request as processing
  static async markRequestProcessing(
    fingerprint: string, 
    storage: IdempotencyStorage
  ): Promise<void> {
    await storage.set(fingerprint, {
      status: 'processing',
      timestamp: Date.now(),
      response: null
    }, {
      ttl: 300 // 5 minutes TTL
    });
  }

  // Mark request as completed
  static async markRequestCompleted(
    fingerprint: string, 
    response: any, 
    storage: IdempotencyStorage
  ): Promise<void> {
    await storage.set(fingerprint, {
      status: 'completed',
      timestamp: Date.now(),
      response
    }, {
      ttl: 86400 // 24 hours TTL
    });
  }

  // Clean up expired entries
  static async cleanupExpiredEntries(storage: IdempotencyStorage): Promise<void> {
    // This would be implemented with a cleanup job
    // For now, TTL is handled by storage layer
  }

  // Generate idempotency key for client
  static generateIdempotencyKey(): string {
    return `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract idempotency key from headers
  static extractIdempotencyKey(headers: Record<string, string>): string | null {
    // Check common header names
    const headerNames = [
      'idempotency-key',
      'x-idempotency-key',
      'idempotency-key',
      'x-idempotency-key'
    ];

    for (const headerName of headerNames) {
      const key = headers[headerName.toLowerCase()];
      if (key) {
        return key;
      }
    }

    return null;
  }

  // Validate request body for idempotency
  static validateRequestBody(body: any): RuleResult {
    // Request body should be serializable
    try {
      JSON.stringify(body);
    } catch (error) {
      return {
        isValid: false,
        error: 'Request body is not serializable',
        code: 'INVALID_REQUEST_BODY'
      };
    }

    // Check body size (prevent abuse)
    const bodySize = JSON.stringify(body).length;
    if (bodySize > 1024 * 1024) { // 1MB limit
      return {
        isValid: false,
        error: 'Request body too large for idempotency',
        code: 'REQUEST_BODY_TOO_LARGE'
      };
    }

    return { isValid: true };
  }

  // Normalize request body for fingerprinting
  private static normalizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Sort object keys for consistent fingerprinting
    const normalized: any = {};
    const sortedKeys = Object.keys(body).sort();
    
    for (const key of sortedKeys) {
      if (body[key] !== null && body[key] !== undefined) {
        normalized[key] = body[key];
      }
    }

    return normalized;
  }

  // Hash fingerprint
  private static hashFingerprint(data: any): string {
    const crypto = require('crypto');
    const stringData = JSON.stringify(data);
    return crypto.createHash('sha256').update(stringData).digest('hex');
  }
}

// Idempotency Storage Interface
export interface IdempotencyStorage {
  get(key: string): Promise<IdempotencyEntry | null>;
  set(key: string, value: IdempotencyEntry, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

// Idempotency Entry
export interface IdempotencyEntry {
  status: 'processing' | 'completed' | 'failed';
  timestamp: number;
  response?: any;
  error?: string;
}

// Redis Implementation (example)
export class RedisIdempotencyStorage implements IdempotencyStorage {
  private redis: any;

  constructor(redis: any) {
    this.redis = redis;
  }

  async get(key: string): Promise<IdempotencyEntry | null> {
    try {
      const value = await this.redis.get(`idempotency:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: IdempotencyEntry, options?: { ttl?: number }): Promise<void> {
    const serialized = JSON.stringify(value);
    const ttl = options?.ttl || 86400; // 24 hours default
    
    await this.redis.setex(`idempotency:${key}`, ttl, serialized);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(`idempotency:${key}`);
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically
  }
}

// Memory Implementation (for development/testing)
export class MemoryIdempotencyStorage implements IdempotencyStorage {
  private storage = new Map<string, { value: IdempotencyEntry; expiry: number }>();

  async get(key: string): Promise<IdempotencyEntry | null> {
    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.storage.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: IdempotencyEntry, options?: { ttl?: number }): Promise<void> {
    const ttl = options?.ttl || 86400; // 24 hours default
    this.storage.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.expiry) {
        this.storage.delete(key);
      }
    }
  }
}

// Idempotency Middleware Factory
export const createIdempotencyMiddleware = (storage: IdempotencyStorage) => {
  return async (req: any, res: any, next: any) => {
    // Extract idempotency key
    const idempotencyKey = IdempotencyEngine.extractIdempotencyKey(req.headers);
    
    if (!idempotencyKey) {
      return next(); // No idempotency key, proceed normally
    }

    // Validate idempotency key
    const keyValidation = IdempotencyEngine.validateIdempotencyKey(idempotencyKey);
    if (!keyValidation.isValid) {
      return res.status(400).json({
        error: keyValidation.error,
        code: keyValidation.code
      });
    }

    // Generate request fingerprint
    const fingerprint = IdempotencyEngine.generateRequestFingerprint({
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      workspaceId: req.user?.workspaceId,
      body: req.body,
      headers: req.headers
    });

    // Check if already processed
    const checkResult = await IdempotencyEngine.checkRequestProcessed(fingerprint, storage);
    
    if (checkResult.processed) {
      if (checkResult.response) {
        return res.status(200).json(checkResult.response);
      }
      return res.status(409).json({
        error: checkResult.error || 'Request already processed',
        code: 'REQUEST_ALREADY_PROCESSED'
      });
    }

    // Mark as processing
    await IdempotencyEngine.markRequestProcessing(fingerprint, storage);

    // Override res.json to capture response
    const originalJson = res.json;
    let capturedResponse: any;

    res.json = function(data: any) {
      capturedResponse = data;
      return originalJson.call(this, data);
    };

    // Continue processing
    res.on('finish', async () => {
      if (capturedResponse && res.statusCode === 200) {
        await IdempotencyEngine.markRequestCompleted(fingerprint, capturedResponse, storage);
      }
    });

    next();
  };
};
