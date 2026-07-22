# 📊 COMPLETE API MAP - FLUENTIVE CRM

## 🎯 CORE BUSINESS APIS

### 📈 Dashboard
```
GET /api/dashboard/summary
- Auth: Required
- Response: {
  success: true,
  data: {
    users: { total, active, online: [...] },
    leads: { total, converted, conversionRate, byStatus, daily },
    timeTracking: { today, weekly, averageProductivity },
    engagement: { pageViews, activities, recent },
    charts: { leadsByStatus, timeByDay, activityBreakdown }
  }
}
```

### 🎯 Leads Management
```
GET /api/leads
- Query: search, status, source, course, page, limit
- Response: { success, data: leads[], count, total, pagination }

POST /api/leads
- Body: lead data
- Response: { success, data: createdLead }

GET /api/leads/[id]
- Response: { success, data: lead }

PUT /api/leads/[id]
- Body: lead updates
- Response: { success, data: updatedLead }

GET /api/leads/stats
- Query: range (7d, 30d, 90d, 1y)
- Response: { success, data: stats }

GET /api/leads/[id]/notes
- Response: { success, data: notes[] }

POST /api/leads/[id]/notes
- Body: note content
- Response: { success, data: createdNote }
```

### 💰 Deals & Sales Pipeline
```
GET /api/deals
- Response: { success, data: deals[] }

POST /api/deals
- Body: deal data
- Response: { success, data: createdDeal }

GET /api/deals/[id]
- Response: { success, data: deal }

PUT /api/deals/[id]
- Body: deal updates
- Response: { success, data: updatedDeal }
```

## ⏱ TIME TRACKING SYSTEM

### 🫀 Heartbeat (Critical)
```
POST /api/time-tracking/heartbeat
- Body: { isIdle: boolean }
- Response: {
  success: true,
  data: {
    totalSeconds, totalHours, activeSeconds, idleSeconds,
    activeHours, idleHours, isIdle, productivityScore, isActive
  }
}
```

### 👥 Active Users
```
GET /api/time-tracking/active-users
- Response: {
  success: true,
  data: [{
    id, name, email, role, lastActivity, lastHeartbeat,
    isActive, isIdle, isOnline, source, onlineStatus
  }],
  count, onlineCount
}
```

### 📋 Activities Timeline
```
GET /api/time-tracking/activities
- Query: limit
- Response: {
  success: true,
  data: [{
    id, type, title, description, timestamp, icon, timestampType, category
  }],
  count
}
```

### 📊 My Time Tracking
```
GET /api/time-tracking/my-time
- Query: startDate, endDate
- Response: {
  success: true,
  data: {
    records: [...],
    totalSeconds, totalHours, avgHoursPerDay, todayHours
  }
}
```

### 👨‍💼 All Time (Admin)
```
GET /api/time-tracking/all-time
- Query: startDate, endDate, userId
- Auth: Admin only
- Response: { success, data: { timeTrackings, summary } }
```

### 📄 Page Views
```
GET /api/time-tracking/page-views
- Response: {
  success: true,
  data: { topPages, totalViews }
}
```

### 🚪 End Session
```
POST /api/time-tracking/end-session
- Response: {
  success: true,
  data: { sessionsUpdated, timeTrackingUpdated }
}
```

## 🔐 AUTHENTICATION

### 📝 Login/Logout
```
POST /api/auth/login
- Body: { email, password }
- Response: { success, data: { user, token } }

POST /api/auth/logout
- Response: { success, message }

GET /api/auth/me
- Response: { success, data: user }

POST /api/auth/refresh
- Response: { success, data: { token } }
```

### 📱 Register
```
POST /api/auth/register
- Body: user data
- Response: { success, data: createdUser }
```

## 🔔 NOTIFICATIONS

### 📬 Notifications
```
GET /api/notifications
- Response: { success, data: notifications[] }

POST /api/notifications/[id]/read
- Response: { success, message }

POST /api/notifications/read-all
- Response: { success, message }
```

## 👥 USERS MANAGEMENT

### 🧑‍💼 Users
```
GET /api/users
- Auth: Admin only
- Response: { success, data: users[] }

GET /api/users/[id]
- Response: { success, data: user }

PUT /api/users/[id]
- Body: user updates
- Response: { success, data: updatedUser }
```

## 📝 ACTIVITY LOGS

### 📋 Activity Logs
```
GET /api/activity-logs
- Response: { success, data: logs[] }
```

## 🤖 AI FEATURES

### 🧠 AI Dashboard
```
GET /api/ai/dashboard
- Response: { success, data: aiInsights }
```

## 🏥 HEALTH

### 💓 Health Check
```
GET /api/health
- Response: { status: "ok", timestamp }
```

## 🔄 V2 APIS (Legacy Check)

### 📊 V2 Leads
```
GET /api/v2/leads
- Check: Compare with /api/leads for consistency
```

## 📋 COMMON RESPONSE PATTERNS

### ✅ Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": number,
  "total": number,
  "pagination": { page, limit }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message"
}
```

## 🔍 INTEGRATION CHECKLIST

### Frontend Pages → Required APIs
- `/dashboard` → `/api/dashboard/summary`
- `/leads` → `/api/leads`, `/api/leads/stats`
- `/leads/[id]` → `/api/leads/[id]`, `/api/leads/[id]/notes`
- `/sales-pipeline` → `/api/deals`
- `/activity-logs` → `/api/activity-logs`
- `/users` → `/api/users`
- Time tracking → `/api/time-tracking/*`

### Auth Requirements
- All APIs require authentication except:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/health`

### Admin-Only APIs
- `/api/users`
- `/api/time-tracking/all-time`
- `/api/users/[id]/unlock`
