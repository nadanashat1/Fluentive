import { RuleResult, DomainUser, DomainLead, DomainDeal } from './types';
import { Roles, RoleType } from '@/constants/roles';


// Domain Invariants - Business Logic Enforcement
export class DomainInvariants {
  
  // Multi-tenancy invariants
  static validateWorkspaceIsolation(userWorkspaceId: string, resourceWorkspaceId: string): RuleResult {
    if (userWorkspaceId !== resourceWorkspaceId) {
      return {
        isValid: false,
        error: 'Resource belongs to different workspace',
        code: 'WORKSPACE_ISOLATION_VIOLATION'
      };
    }
    return { isValid: true };
  }

  // Ownership invariants
  static validateResourceOwnership(resourceOwnerId: string, currentUserId: string, userRole: string): RuleResult {
    if (resourceOwnerId !== currentUserId) {
      // Managers and admins can access any resource in workspace
      if (userRole !== Roles.MANAGER && userRole !== Roles.ADMIN) {
        return {
          isValid: false,
          error: 'User does not own this resource',
          code: 'RESOURCE_OWNERSHIP_VIOLATION'
        };
      }
    }
    return { isValid: true };
  }

  // Data integrity invariants
  static validateEmailIntegrity(email: string): RuleResult {
    if (!email || email.trim().length === 0) {
      return {
        isValid: false,
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      };
    }

    return { isValid: true };
  }

  static validatePhoneNumber(phone: string): RuleResult {
    if (!phone || phone.trim().length === 0) {
      return {
        isValid: false,
        error: 'Phone number is required',
        code: 'PHONE_REQUIRED'
      };
    }

    // Basic phone validation - can be enhanced
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
        code: 'INVALID_PHONE_FORMAT'
      };
    }

    return { isValid: true };
  }

  static validateName(name: string, fieldName: string = 'Name'): RuleResult {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
        code: 'NAME_REQUIRED'
      };
    }

    if (name.trim().length < 2) {
      return {
        isValid: false,
        error: `${fieldName} must be at least 2 characters`,
        code: 'NAME_TOO_SHORT'
      };
    }

    if (name.trim().length > 100) {
      return {
        isValid: false,
        error: `${fieldName} must be less than 100 characters`,
        code: 'NAME_TOO_LONG'
      };
    }

    return { isValid: true };
  }

  // Business logic invariants
  static validateLeadDealIntegrity(lead: DomainLead, deal: DomainDeal): RuleResult {
    // Business Rule: Deal must reference the same lead
    if (deal.leadId !== lead.id) {
      return {
        isValid: false,
        error: 'Deal must reference the correct lead',
        code: 'LEAD_DEAL_MISMATCH'
      };
    }

    // Business Rule: Both must belong to same workspace
    if (lead.workspaceId !== deal.workspaceId) {
      return {
        isValid: false,
        error: 'Lead and Deal must belong to same workspace',
        code: 'WORKSPACE_MISMATCH'
      };
    }

    // Business Rule: Both must have same owner
    if (lead.ownerId !== deal.ownerId) {
      return {
        isValid: false,
        error: 'Lead and Deal must have same owner',
        code: 'OWNER_MISMATCH'
      };
    }

    return { isValid: true };
  }

  // State transition invariants
  static validateStateTransition(currentState: string, newState: string, allowedTransitions: Record<string, string[]>): RuleResult {
    const validTransitions = allowedTransitions[currentState] || [];
    
    if (!validTransitions.includes(newState)) {
      return {
        isValid: false,
        error: `Invalid transition from ${currentState} to ${newState}`,
        code: 'INVALID_STATE_TRANSITION'
      };
    }

    return { isValid: true };
  }

  // Data consistency invariants
  static validateConsistencyCheck(entity: any, rules: Array<(entity: any) => RuleResult>): RuleResult {
    for (const rule of rules) {
      const result = rule(entity);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }

  // Business constraint invariants
  static validatePositiveNumber(value: number, fieldName: string): RuleResult {
    if (value < 0) {
      return {
        isValid: false,
        error: `${fieldName} must be positive`,
        code: 'INVALID_POSITIVE_NUMBER'
      };
    }
    return { isValid: true };
  }

  static validateNonZeroNumber(value: number, fieldName: string): RuleResult {
    if (value === 0) {
      return {
        isValid: false,
        error: `${fieldName} cannot be zero`,
        code: 'INVALID_NON_ZERO_NUMBER'
      };
    }
    return { isValid: true };
  }

  static validateRange(value: number, fieldName: string, min: number, max: number): RuleResult {
    if (value < min || value > max) {
      return {
        isValid: false,
        error: `${fieldName} must be between ${min} and ${max}`,
        code: 'INVALID_RANGE'
      };
    }
    return { isValid: true };
  }

  // Temporal invariants
  static validateDateOrder(startDate: Date, endDate: Date, fieldName: string): RuleResult {
    if (startDate >= endDate) {
      return {
        isValid: false,
        error: `${fieldName} start date must be before end date`,
        code: 'INVALID_DATE_ORDER'
      };
    }
    return { isValid: true };
  }

  static validateFutureDate(date: Date, fieldName: string): RuleResult {
    if (date > new Date()) {
      return {
        isValid: false,
        error: `${fieldName} cannot be in the future`,
        code: 'INVALID_FUTURE_DATE'
      };
    }
    return { isValid: true };
  }

  // Uniqueness invariants
  static validateUniqueness(value: string, existingValues: string[], fieldName: string): RuleResult {
    if (existingValues.includes(value)) {
      return {
        isValid: false,
        error: `${fieldName} must be unique`,
        code: 'DUPLICATE_VALUE'
      };
    }
    return { isValid: true };
  }

  // Security invariants
  static validateNoSqlInjection(input: string): RuleResult {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Invalid input detected',
          code: 'SECURITY_VIOLATION'
        };
      }
    }

    return { isValid: true };
  }

  static validateNoXss(input: string): RuleResult {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Invalid input detected',
          code: 'SECURITY_VIOLATION'
        };
      }
    }

    return { isValid: true };
  }

  // Performance invariants
  static validatePaginationLimits(page: number, limit: number, maxLimit: number = 100): RuleResult {
    if (page < 1) {
      return {
        isValid: false,
        error: 'Page number must be greater than 0',
        code: 'INVALID_PAGE_NUMBER'
      };
    }

    if (limit < 1 || limit > maxLimit) {
      return {
        isValid: false,
        error: `Limit must be between 1 and ${maxLimit}`,
        code: 'INVALID_PAGE_LIMIT'
      };
    }

    return { isValid: true };
  }

  // Business rule composition
  static composeRules(rules: Array<() => RuleResult>): RuleResult {
    for (const rule of rules) {
      const result = rule();
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }

  // Domain event validation
  static validateDomainEvent(event: any): RuleResult {
    if (!event.id || !event.type || !event.aggregateId || !event.timestamp) {
      return {
        isValid: false,
        error: 'Domain event must have id, type, aggregateId, and timestamp',
        code: 'INVALID_DOMAIN_EVENT'
      };
    }

    return { isValid: true };
  }
}

// Invariant rule builders
export const InvariantRules = {
  // Email validation
  email: (email: string) => () => DomainInvariants.validateEmailIntegrity(email),
  
  // Phone validation
  phone: (phone: string) => () => DomainInvariants.validatePhoneNumber(phone),
  
  // Name validation
  name: (name: string, fieldName?: string) => () => DomainInvariants.validateName(name, fieldName),
  
  // Positive number validation
  positiveNumber: (value: number, fieldName: string) => () => DomainInvariants.validatePositiveNumber(value, fieldName),
  
  // Range validation
  range: (value: number, fieldName: string, min: number, max: number) => () => 
    DomainInvariants.validateRange(value, fieldName, min, max),
  
  // Workspace isolation
  workspaceIsolation: (userWorkspaceId: string, resourceWorkspaceId: string) => () =>
    DomainInvariants.validateWorkspaceIsolation(userWorkspaceId, resourceWorkspaceId),
  
  // Resource ownership
  resourceOwnership: (resourceOwnerId: string, currentUserId: string, userRole: string) => () =>
    DomainInvariants.validateResourceOwnership(resourceOwnerId, currentUserId, userRole),
  
  // State transition
  stateTransition: (currentState: string, newState: string, allowedTransitions: Record<string, string[]>) => () =>
    DomainInvariants.validateStateTransition(currentState, newState, allowedTransitions)
};
