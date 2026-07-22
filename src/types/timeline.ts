/**
 * Timeline item types for activity and session events
 * Used across time tracking and dashboard services
 */

export type TimelineItem = {
  id: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'other' | string;
  title: string;
  description?: string;
  timestamp: string;
  icon: string;
  timestampType?: 'loginAt' | 'logoutAt' | 'createdAt';
  category: 'system' | 'activity';
};
