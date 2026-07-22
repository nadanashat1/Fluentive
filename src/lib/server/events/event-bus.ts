import { eventProvider, SystemEvent } from '../providers';
import { getContext } from '../request-context';

/**
 * ENTERPRISE EVENT BUS v2
 * Centralized decoupled event system for cross-module communication and observability.
 * Backed by the provider abstraction (Memory/Redis) to support distributed operation.
 */

export const SYSTEM_EVENTS = {
  // Authentication
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_REFRESH_STARTED: 'AUTH_REFRESH_STARTED',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',

  // AI Orchestration
  AI_OVERVIEW_CACHE_HIT: 'AI_OVERVIEW_CACHE_HIT',
  AI_OVERVIEW_CACHE_MISS: 'AI_OVERVIEW_CACHE_MISS',
  AI_OVERVIEW_TIMEOUT: 'AI_OVERVIEW_TIMEOUT',
  AI_OVERVIEW_DEGRADED: 'AI_OVERVIEW_DEGRADED',
  AI_USAGE_LOGGED: 'AI_USAGE_LOGGED',

  // Performance & Limits
  QUERY_SLOW: 'QUERY_SLOW',
  RATE_LIMIT_TRIGGERED: 'RATE_LIMIT_TRIGGERED',

  // System Failures
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  WIDGET_CRASHED: 'WIDGET_CRASHED',

  // Resilience Circuit Breakers
  CIRCUIT_OPENED: 'CIRCUIT_OPENED',
  CIRCUIT_HALF_OPEN: 'CIRCUIT_HALF_OPEN',
  CIRCUIT_RECOVERED: 'CIRCUIT_RECOVERED',
  
  // API Errors
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  API_CLIENT_ERROR: 'API_CLIENT_ERROR',
  API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',

  // Legacy Domain Events (preservation for compatibility)
  LEAD_CREATED: 'lead.created',
  LEAD_QUALIFIED: 'lead.qualified',
  LEAD_LOST: 'lead.lost',
  LEAD_CONVERTED: 'lead.converted',
  DEAL_CREATED: 'deal.created',
  DEAL_WON: 'deal.won',
  DEAL_LOST: 'deal.lost',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
  CANDIDATE_HIRED: 'candidate.hired',
  CANDIDATE_REJECTED: 'candidate.rejected',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  TASK_COMPLETED: 'task.completed',
} as const;

export type SystemEventType = typeof SYSTEM_EVENTS[keyof typeof SYSTEM_EVENTS];

class EnterpriseEventBus {
  private static instance: EnterpriseEventBus;

  private constructor() {}

  public static getInstance(): EnterpriseEventBus {
    if (!EnterpriseEventBus.instance) {
      EnterpriseEventBus.instance = new EnterpriseEventBus();
    }
    return EnterpriseEventBus.instance;
  }

  /**
   * Publish a strongly typed system event with automatic context enrichment.
   */
  public emit(type: SystemEventType, severity: SystemEvent['severity'], payload: Record<string, unknown> = {}) {
    const context = getContext() || {};
    
    const event: SystemEvent = {
      type,
      timestamp: new Date().toISOString(),
      severity,
      context,
      payload
    };

    eventProvider.emit(event);
  }

  /**
   * Publish a legacy event (backwards compatibility).
   */
  public async publish(event: string, payload: any) {
    this.emit(event as SystemEventType, 'info', payload);
  }

  /**
   * Subscribe to a specific event type.
   */
  public subscribe(eventType: SystemEventType, handler: (event: SystemEvent) => void) {
    return eventProvider.subscribe(eventType, handler);
  }

  /**
   * Subscribe to legacy event format (backwards compatibility).
   */
  public subscribeLegacy(event: string, handler: (payload: any) => void) {
    return eventProvider.subscribe(event, (sysEvent) => handler(sysEvent.payload));
  }
}

export const eventBus = EnterpriseEventBus.getInstance();
