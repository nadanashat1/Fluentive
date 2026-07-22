-- Enterprise Database Optimization Indexes
-- Run these in Supabase SQL Editor for performance boost
-- These indexes significantly improve query performance for large datasets

-- ==========================================
-- USER TABLE INDEXES
-- ==========================================

-- Primary lookup by email (login/authentication)
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);

-- Role-based queries (admin dashboards, user management)
CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role);

-- Active status filtering (soft delete patterns)
CREATE INDEX IF NOT EXISTS idx_users_isActive ON "User"("isActive");

-- Login tracking (security audits, suspicious activity)
CREATE INDEX IF NOT EXISTS idx_users_lastLoginAt ON "User"("lastLoginAt");

-- Account lockout checks
CREATE INDEX IF NOT EXISTS idx_users_lockUntil ON "User"("lockUntil");

-- ==========================================
-- LEAD TABLE INDEXES
-- ==========================================

-- Owner-based queries (my leads, team leads)
CREATE INDEX IF NOT EXISTS idx_leads_ownerId ON "Lead"("ownerId");

-- Status filtering (pipeline views, status dashboards)
CREATE INDEX IF NOT EXISTS idx_leads_status ON "Lead"(status);

-- Priority sorting (high priority first views)
CREATE INDEX IF NOT EXISTS idx_leads_priority ON "Lead"(priority);

-- Date range queries (created this week/month)
CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON "Lead"("createdAt");

-- Follow-up date tracking (tasks, reminders)
CREATE INDEX IF NOT EXISTS idx_leads_followUpDate ON "Lead"("followUpDate");

-- Compound index for owner + status (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_leads_owner_status ON "Lead"("ownerId", status);

-- Source tracking (analytics, attribution)
CREATE INDEX IF NOT EXISTS idx_leads_source ON "Lead"(source);

-- Tags filtering (if using GIN for array search)
-- Note: For Supabase, you may need to enable the pg_trgm extension
CREATE INDEX IF NOT EXISTS idx_leads_tags ON "Lead" USING GIN(tags);

-- ==========================================
-- DEAL TABLE INDEXES
-- ==========================================

-- Stage filtering (pipeline stages)
CREATE INDEX IF NOT EXISTS idx_deals_stage ON "Deal"(stage);

-- Priority sorting
CREATE INDEX IF NOT EXISTS idx_deals_priority ON "Deal"(priority);

-- Assignee queries (my deals)
CREATE INDEX IF NOT EXISTS idx_deals_assigneeName ON "Deal"("assigneeName");

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_deals_createdAt ON "Deal"("createdAt");

-- Follow-up tracking
CREATE INDEX IF NOT EXISTS idx_deals_followUpDate ON "Deal"("followUpDate");

-- Stage + Priority compound (dashboard sorting)
CREATE INDEX IF NOT EXISTS idx_deals_stage_priority ON "Deal"(stage, priority);

-- ==========================================
-- NOTIFICATION TABLE INDEXES
-- ==========================================

-- User notifications (inbox)
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON "Notification"("userId");

-- Read status filtering (unread count)
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON "Notification"("isRead");

-- User + Read compound (fetch unread notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON "Notification"("userId", "isRead");

-- Recent notifications (chronological)
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON "Notification"("createdAt" DESC);

-- ==========================================
-- ACTIVITY LOG TABLE INDEXES
-- ==========================================

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_activityLogs_userId ON "ActivityLog"("userId");

-- Lead activity history
CREATE INDEX IF NOT EXISTS idx_activityLogs_leadId ON "ActivityLog"("leadId");

-- Recent activity (timeline)
CREATE INDEX IF NOT EXISTS idx_activityLogs_createdAt ON "ActivityLog"("createdAt" DESC);

-- Action type filtering
CREATE INDEX IF NOT EXISTS idx_activityLogs_action ON "ActivityLog"(action);

-- ==========================================
-- TIME TRACKING TABLE INDEXES
-- ==========================================

-- User time tracking (daily stats)
CREATE INDEX IF NOT EXISTS idx_timeTracking_userId ON "TimeTracking"("userId");

-- Date-based queries (daily reports)
CREATE INDEX IF NOT EXISTS idx_timeTracking_date ON "TimeTracking"(date);

-- User + Date compound (unique constraint already creates index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_timeTracking_user_date ON "TimeTracking"("userId", date);

-- Active sessions
CREATE INDEX IF NOT EXISTS idx_timeTracking_isActive ON "TimeTracking"("isActive");

-- ==========================================
-- REFRESH TOKEN TABLE INDEXES
-- ==========================================

-- User sessions
CREATE INDEX IF NOT EXISTS idx_refreshTokens_userId ON "RefreshToken"("userId");

-- Token lookup (logout, refresh)
CREATE INDEX IF NOT EXISTS idx_refreshTokens_token ON "RefreshToken"(token);

-- Expired token cleanup
CREATE INDEX IF NOT EXISTS idx_refreshTokens_expiresAt ON "RefreshToken"("expiresAt");

-- ==========================================
-- NOTE TABLE INDEXES
-- ==========================================

-- Lead notes
CREATE INDEX IF NOT EXISTS idx_notes_leadId ON "LeadNote"("leadId");

-- Author notes (my notes)
CREATE INDEX IF NOT EXISTS idx_notes_authorId ON "LeadNote"("authorId");

-- Chronological
CREATE INDEX IF NOT EXISTS idx_notes_createdAt ON "LeadNote"("createdAt" DESC);

-- ==========================================
-- ATTACHMENT TABLE INDEXES
-- ==========================================

-- Lead attachments
CREATE INDEX IF NOT EXISTS idx_attachments_leadId ON "LeadAttachment"("leadId");

-- Uploader tracking
CREATE INDEX IF NOT EXISTS idx_attachments_uploadedById ON "LeadAttachment"("uploadedById");

-- ==========================================
-- PERFORMANCE MONITORING
-- ==========================================

-- Check index usage (run periodically)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Check table sizes
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/
