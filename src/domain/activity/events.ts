import { ActivityType, DomainActivity, DomainEvent, RuleResult } from '../shared/types';

// Activity Event System - CRM Event Sourcing
export class ActivityEventEngine {
  
  static validateActivityCreation(activity: Partial<DomainActivity>): RuleResult {
    // Business Rule: Activity must have type
    if (!activity.type || !Object.values(ActivityType).includes(activity.type)) {
      return {
        isValid: false,
        error: `Invalid activity type: ${activity.type}`,
        code: 'INVALID_ACTIVITY_TYPE'
      };
    }

    // Business Rule: Activity must have description
    if (!activity.description || activity.description.trim().length === 0) {
      return {
        isValid: false,
        error: 'Activity must have a description',
        code: 'INVALID_ACTIVITY_DESCRIPTION'
      };
    }

    // Business Rule: Activity must reference user
    if (!activity.userId) {
      return {
        isValid: false,
        error: 'Activity must reference a user',
        code: 'INVALID_ACTIVITY_USER'
      };
    }

    // Business Rule: Activity must reference at least one entity
    if (!activity.leadId && !activity.dealId) {
      return {
        isValid: false,
        error: 'Activity must reference a lead or deal',
        code: 'INVALID_ACTIVITY_REFERENCE'
      };
    }

    return { isValid: true };
  }

  static createLeadActivity(leadId: string, userId: string, workspaceId: string, type: ActivityType, description: string): DomainActivity {
    return {
      id: this.generateActivityId(),
      workspaceId,
      userId,
      leadId,
      type,
      description,
      createdAt: new Date()
    };
  }

  static createDealActivity(dealId: string, userId: string, workspaceId: string, type: ActivityType, description: string): DomainActivity {
    return {
      id: this.generateActivityId(),
      workspaceId,
      userId,
      dealId,
      type,
      description,
      createdAt: new Date()
    };
  }

  static createActivityEvent(activity: DomainActivity, eventType: string, userId: string): DomainEvent {
    return {
      id: this.generateEventId(),
      type: eventType,
      aggregateId: activity.id,
      aggregateType: 'Activity',
      data: {
        activityId: activity.id,
        type: activity.type,
        description: activity.description,
        userId: activity.userId,
        leadId: activity.leadId,
        dealId: activity.dealId,
        workspaceId: activity.workspaceId
      },
      timestamp: new Date(),
      userId,
      workspaceId: activity.workspaceId
    };
  }

  // Activity Type Validation
  static validateLeadActivityType(type: ActivityType, leadStatus: string): RuleResult {
    const validLeadActivities = [
      ActivityType.LEAD_CREATED,
      ActivityType.LEAD_UPDATED,
      ActivityType.LEAD_CONVERTED,
      ActivityType.NOTE_ADDED,
      ActivityType.CALL_LOGGED,
      ActivityType.EMAIL_SENT
    ];

    if (!validLeadActivities.includes(type)) {
      return {
        isValid: false,
        error: `Activity type ${type} is not valid for leads`,
        code: 'INVALID_LEAD_ACTIVITY_TYPE'
      };
    }

    // Business Rule: Cannot mark lead as converted if not qualified
    if (type === ActivityType.LEAD_CONVERTED && leadStatus !== 'QUALIFIED') {
      return {
        isValid: false,
        error: 'Lead must be QUALIFIED to be converted',
        code: 'LEAD_NOT_QUALIFIED_FOR_CONVERSION'
      };
    }

    return { isValid: true };
  }

  static validateDealActivityType(type: ActivityType, dealStage: string): RuleResult {
    const validDealActivities = [
      ActivityType.DEAL_CREATED,
      ActivityType.DEAL_UPDATED,
      ActivityType.DEAL_WON,
      ActivityType.DEAL_LOST,
      ActivityType.NOTE_ADDED,
      ActivityType.CALL_LOGGED,
      ActivityType.EMAIL_SENT
    ];

    if (!validDealActivities.includes(type)) {
      return {
        isValid: false,
        error: `Activity type ${type} is not valid for deals`,
        code: 'INVALID_DEAL_ACTIVITY_TYPE'
      };
    }

    // Business Rule: Cannot mark deal as won/lost if already in terminal state
    if ((type === ActivityType.DEAL_WON || type === ActivityType.DEAL_LOST) && 
        (dealStage === 'WON' || dealStage === 'LOST')) {
      return {
        isValid: false,
        error: `Deal is already in terminal state: ${dealStage}`,
        code: 'DEAL_ALREADY_TERMINAL'
      };
    }

    return { isValid: true };
  }

  // Activity Timeline Validation
  static validateActivityTimeline(activities: DomainActivity[]): RuleResult {
    // Business Rule: Activities must be in chronological order
    const sortedActivities = [...activities].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    for (let i = 1; i < sortedActivities.length; i++) {
      if (sortedActivities[i].createdAt < sortedActivities[i - 1].createdAt) {
        return {
          isValid: false,
          error: 'Activity timeline must be chronological',
          code: 'INVALID_ACTIVITY_TIMELINE'
        };
      }
    }

    return { isValid: true };
  }

  // Activity Aggregation Rules
  static aggregateLeadActivities(leadId: string, activities: DomainActivity[]): {
    totalActivities: number;
    activitiesByType: Record<ActivityType, number>;
    lastActivity: DomainActivity | null;
    conversionActivity: DomainActivity | null;
  } {
    const leadActivities = activities.filter(activity => activity.leadId === leadId);
    
    const activitiesByType = leadActivities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>);

    const lastActivity = leadActivities.length > 0 
      ? leadActivities.reduce((latest, activity) => 
          activity.createdAt > latest.createdAt ? activity : latest
        )
      : null;

    const conversionActivity = leadActivities.find(activity => activity.type === ActivityType.LEAD_CONVERTED) || null;

    return {
      totalActivities: leadActivities.length,
      activitiesByType,
      lastActivity,
      conversionActivity
    };
  }

  static aggregateDealActivities(dealId: string, activities: DomainActivity[]): {
    totalActivities: number;
    activitiesByType: Record<ActivityType, number>;
    lastActivity: DomainActivity | null;
    winActivity: DomainActivity | null;
    lossActivity: DomainActivity | null;
  } {
    const dealActivities = activities.filter(activity => activity.dealId === dealId);
    
    const activitiesByType = dealActivities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>);

    const lastActivity = dealActivities.length > 0 
      ? dealActivities.reduce((latest, activity) => 
          activity.createdAt > latest.createdAt ? activity : latest
        )
      : null;

    const winActivity = dealActivities.find(activity => activity.type === ActivityType.DEAL_WON) || null;
    const lossActivity = dealActivities.find(activity => activity.type === ActivityType.DEAL_LOST) || null;

    return {
      totalActivities: dealActivities.length,
      activitiesByType,
      lastActivity,
      winActivity,
      lossActivity
    };
  }

  // Activity Search and Filtering
  static filterActivitiesByDateRange(activities: DomainActivity[], startDate: Date, endDate: Date): DomainActivity[] {
    return activities.filter(activity => 
      activity.createdAt >= startDate && activity.createdAt <= endDate
    );
  }

  static filterActivitiesByType(activities: DomainActivity[], types: ActivityType[]): DomainActivity[] {
    return activities.filter(activity => types.includes(activity.type));
  }

  static filterActivitiesByUser(activities: DomainActivity[], userId: string): DomainActivity[] {
    return activities.filter(activity => activity.userId === userId);
  }

  // Activity Performance Metrics
  static calculateActivityMetrics(activities: DomainActivity[]): {
    totalActivities: number;
    averageActivitiesPerDay: number;
    mostActiveDay: string;
    activityTypeDistribution: Record<ActivityType, number>;
  } {
    const totalActivities = activities.length;
    
    // Calculate date range
    const dates = activities.map(activity => activity.createdAt.toDateString());
    const uniqueDates = [...new Set(dates)];
    const averageActivitiesPerDay = uniqueDates.length > 0 ? totalActivities / uniqueDates.length : 0;

    // Find most active day
    const activityCountsByDate = dates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveDay = Object.entries(activityCountsByDate)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    // Activity type distribution
    const activityTypeDistribution = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>);

    return {
      totalActivities,
      averageActivitiesPerDay: Math.round(averageActivitiesPerDay * 100) / 100,
      mostActiveDay,
      activityTypeDistribution
    };
  }

  // Private helpers
  private static generateActivityId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Activity Business Rules - Domain Invariants
export const ActivityBusinessRules = {
  // Rule: Activity frequency limits
  validateActivityFrequency(userId: string, activitiesInLastHour: number, maxAllowed: number = 50): RuleResult {
    if (activitiesInLastHour >= maxAllowed) {
      return {
        isValid: false,
        error: `User has exceeded activity frequency limit (${maxAllowed} per hour)`,
        code: 'ACTIVITY_FREQUENCY_EXCEEDED'
      };
    }
    return { isValid: true };
  },

  // Rule: Activity content validation
  validateActivityContent(description: string, maxLength: number = 1000): RuleResult {
    if (description.length > maxLength) {
      return {
        isValid: false,
        error: `Activity description exceeds maximum length (${maxLength} characters)`,
        code: 'ACTIVITY_DESCRIPTION_TOO_LONG'
      };
    }
    return { isValid: true };
  },

  // Rule: Activity retention policy
  validateActivityRetention(activityDate: Date, maxRetentionDays: number = 365): RuleResult {
    const daysOld = Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOld > maxRetentionDays) {
      return {
        isValid: false,
        error: `Activity exceeds retention policy (${maxRetentionDays} days)`,
        code: 'ACTIVITY_RETENTION_EXCEEDED'
      };
    }
    return { isValid: true };
  }
};
