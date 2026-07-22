# 📚 Fluentive CRM - Complete API Documentation

## 🔗 API Overview

Fluentive CRM provides a comprehensive REST API with **82+ endpoints** covering all CRM functionality. The API is designed for scalability, security, and ease of integration.

### **Base URL**: `https://your-domain.vercel.app/api`
### **API Version**: v3.0.0
### **Authentication**: JWT Bearer Token
### **Content-Type**: `application/json`

---

## 🔐 Authentication

### **Login**
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "USER",
      "isActive": true
    },
    "token": "jwt_token_here",
    "expiresIn": "30d"
  }
}
```

### **Register**
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "organization": "Acme Corp"
}
```

### **Logout**
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

### **Get Current User**
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

---

## 👥 User Management

### **Get All Users**
```http
GET /api/users
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `role`: Filter by role
- `isActive`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "John Doe",
        "email": "user@example.com",
        "role": "USER",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "lastLoginAt": "2026-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### **Create User**
```http
POST /api/users
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "USER",
  "organization": "Acme Corp"
}
```

### **Update User**
```http
PUT /api/users/{id}
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "role": "ADMIN",
  "isActive": true
}
```

### **Delete User**
```http
DELETE /api/users/{id}
```

---

## 🎯 Lead Management

### **Get All Leads**
```http
GET /api/leads
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `status`: Filter by status
- `ownerId`: Filter by owner
- `dateRange`: Date range filter

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "lead_id",
        "name": "Acme Corporation",
        "email": "contact@acme.com",
        "phone": "+1-555-0123",
        "company": "Acme Corp",
        "status": "NEW",
        "score": 8.5,
        "conversionProbability": 0.75,
        "owner": {
          "id": "user_id",
          "name": "John Doe"
        },
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### **Create Lead**
```http
POST /api/leads
```

**Request Body:**
```json
{
  "name": "New Company",
  "email": "contact@newcompany.com",
  "phone": "+1-555-0456",
  "company": "New Company",
  "status": "NEW",
  "source": "WEBSITE",
  "notes": "Interested in our services"
}
```

### **Update Lead**
```http
PUT /api/leads/{id}
```

**Request Body:**
```json
{
  "name": "Updated Company",
  "status": "CONTACTED",
  "notes": "Followed up via phone"
}
```

### **Get Lead Details**
```http
GET /api/leads/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lead": {
      "id": "lead_id",
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "+1-555-0123",
      "company": "Acme Corp",
      "status": "QUALIFIED",
      "score": 8.5,
      "conversionProbability": 0.75,
      "owner": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "activities": [
        {
          "id": "activity_id",
          "type": "CALL",
          "subject": "Initial contact",
          "createdAt": "2026-01-15T10:30:00.000Z"
        }
      ],
      "deals": [
        {
          "id": "deal_id",
          "name": "Acme Deal",
          "value": 50000,
          "stage": "PROPOSAL"
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 💼 Deal Management

### **Get All Deals**
```http
GET /api/deals
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `stage`: Filter by stage
- `ownerId`: Filter by owner
- `valueRange`: Filter by value range

**Response:**
```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "id": "deal_id",
        "name": "Acme Deal",
        "value": 50000,
        "stage": "PROPOSAL",
        "probability": 0.75,
        "expectedClose": "2026-02-15T00:00:00.000Z",
        "lead": {
          "id": "lead_id",
          "name": "Acme Corporation"
        },
        "owner": {
          "id": "user_id",
          "name": "John Doe"
        },
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 75,
      "pages": 4
    }
  }
}
```

### **Create Deal**
```http
POST /api/deals
```

**Request Body:**
```json
{
  "name": "New Deal",
  "value": 75000,
  "stage": "QUALIFIED",
  "probability": 0.6,
  "leadId": "lead_id",
  "description": "Large enterprise deal"
}
```

### **Update Deal**
```http
PUT /api/deals/{id}
```

**Request Body:**
```json
{
  "stage": "NEGOTIATION",
  "probability": 0.8,
  "expectedClose": "2026-02-20T00:00:00.000Z"
}
```

---

## 📝 Activity Management

### **Get All Activities**
```http
GET /api/activities
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `type`: Filter by type
- `userId`: Filter by user
- `dateRange`: Date range filter

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_id",
        "type": "CALL",
        "subject": "Initial contact",
        "description": "Called to discuss requirements",
        "outcome": "INTERESTED",
        "date": "2026-01-15T10:30:00.000Z",
        "duration": 30,
        "user": {
          "id": "user_id",
          "name": "John Doe"
        },
        "lead": {
          "id": "lead_id",
          "name": "Acme Corporation"
        },
        "deal": {
          "id": "deal_id",
          "name": "Acme Deal"
        },
        "createdAt": "2026-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 200,
      "pages": 10
    }
  }
}
```

### **Create Activity**
```http
POST /api/activities
```

**Request Body:**
```json
{
  "type": "EMAIL",
  "subject": "Follow-up email",
  "description": "Sent product information",
  "outcome": "SENT",
  "date": "2026-01-15T10:30:00.000Z",
  "duration": 5,
  "leadId": "lead_id"
}
```

---

## 📊 Analytics & Reporting

### **Get Dashboard Summary**
```http
GET /api/dashboard/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalLeads": 150,
      "totalDeals": 75,
      "totalValue": 2500000,
      "conversionRate": 0.5,
      "activeUsers": 25
    },
    "recentActivity": [
      {
        "type": "lead_created",
        "count": 5,
        "timestamp": "2026-01-15T10:30:00.000Z"
      }
    ],
    "performance": {
      "avgDealValue": 33333,
      "avgSalesCycle": 45,
      "winRate": 0.65
    }
  }
}
```

### **Get Analytics Overview**
```http
GET /api/analytics/overview
```

**Query Parameters:**
- `timeframe`: Time period (7d, 30d, 90d)
- `metrics`: Specific metrics to include

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": {
      "total": 150,
      "new": 25,
      "converted": 75,
      "conversionRate": 0.5
    },
    "deals": {
      "total": 75,
      "won": 50,
      "lost": 15,
      "pending": 10,
      "totalValue": 2500000
    },
    "activities": {
      "total": 500,
      "calls": 150,
      "emails": 200,
      "meetings": 100,
      "tasks": 50
    },
    "revenue": {
      "total": 2500000,
      "thisMonth": 500000,
      "lastMonth": 450000,
      "growth": 0.11
    }
  }
}
```

### **Generate Report**
```http
POST /api/reports/generate
```

**Request Body:**
```json
{
  "reportType": "sales_pipeline",
  "format": "json",
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "filters": {
    "status": ["NEW", "QUALIFIED"],
    "ownerId": "user_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Sales Pipeline Report",
      "dateRange": {
        "startDate": "2026-01-01",
        "endDate": "2026-01-31"
      },
      "summary": {
        "totalLeads": 150,
        "totalValue": 2500000,
        "averageDealSize": 33333
      },
      "pipeline": {
        "stageDistribution": [
          {
            "stage": "NEW",
            "count": 50,
            "value": 500000
          }
        ],
        "conversionRates": [
          {
            "from": "NEW",
            "to": "QUALIFIED",
            "rate": 0.6
          }
        ]
      }
    },
    "metadata": {
      "type": "sales_pipeline",
      "format": "json",
      "generatedAt": "2026-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 🤖 AI Insights

### **Get AI Insights**
```http
GET /api/ai/insights
```

**Query Parameters:**
- `type`: Insight type (lead_scoring, churn_prediction, sales_forecasting, behavioral_analysis, comprehensive)
- `timeframe`: Time period (7d, 30d, 90d)

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": {
      "title": "AI Lead Scoring Insights",
      "totalLeads": 150,
      "scoredLeads": [
        {
          "id": "lead_id",
          "name": "Acme Corporation",
          "aiScore": 8.5,
          "scoreBreakdown": {
            "activityFrequency": 5,
            "activityRecency": 0.8,
            "dealEngagement": 2,
            "emailEngagement": 3
          },
          "confidence": 0.85,
          "recommendedActions": [
            "Schedule follow-up call",
            "Send personalized email"
          ],
          "conversionProbability": 0.75
        }
      ],
      "scoringModel": {
        "type": "gradient_boosting",
        "accuracy": 0.87,
        "features": ["activityFrequency", "activityRecency", "dealEngagement"]
      }
    },
    "metadata": {
      "type": "lead_scoring",
      "timeframe": "30d",
      "generatedAt": "2026-01-15T10:30:00.000Z"
    }
  }
}
```

### **Train Custom Model**
```http
POST /api/ai/insights
```

**Request Body:**
```json
{
  "action": "train_model",
  "data": {
    "type": "classification",
    "samples": 1000,
    "features": 10
  }
}
```

---

## 🔔 Notifications

### **Get Notifications**
```http
GET /api/notifications
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type
- `unreadOnly`: Filter by read status

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "type": "LEAD_ASSIGNED",
        "title": "New Lead Assigned",
        "message": "You have been assigned a new lead",
        "isRead": false,
        "createdAt": "2026-01-15T10:30:00.000Z"
      }
    ],
    "unreadCount": 5,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  }
}
```

### **Create Notification**
```http
POST /api/notifications
```

**Request Body:**
```json
{
  "type": "CUSTOM",
  "title": "Custom Notification",
  "message": "This is a custom notification",
  "priority": "normal"
}
```

### **Real-time Notifications**
```http
GET /api/notifications/realtime
```

**Response (Server-Sent Events):**
```
data: {"type":"connected","message":"Connected to notification stream"}

data: {"type":"notifications","data":[{"id":"notif_1","title":"New Lead","message":"You have a new lead"}],"timestamp":"2026-01-15T10:30:00.000Z"}

data: {"type":"heartbeat","timestamp":"2026-01-15T10:31:00.000Z"}
```

---

## 🔍 Advanced Search

### **Advanced Search**
```http
POST /api/search/advanced
```

**Request Body:**
```json
{
  "query": "Acme Corporation",
  "entities": ["leads", "deals", "activities"],
  "filters": {
    "status": ["NEW", "QUALIFIED"],
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20
  },
  "sortBy": "relevance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "Acme Corporation",
    "results": {
      "leads": [
        {
          "id": "lead_id",
          "name": "Acme Corporation",
          "relevanceScore": 0.95,
          "totalValue": 50000
        }
      ],
      "deals": [],
      "activities": []
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "hasMore": false
    }
  }
}
```

---

## 💾 Backup & Recovery

### **Get Backup List**
```http
GET /api/backup/create
```

**Response:**
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "id": "backup_123",
        "type": "full",
        "size": 1024000,
        "createdAt": "2026-01-15T10:30:00.000Z",
        "createdBy": {
          "id": "user_id",
          "name": "John Doe"
        },
        "status": "completed"
      }
    ],
    "statistics": {
      "totalBackups": 10,
      "totalSize": 10240000,
      "averageSize": 1024000
    }
  }
}
```

### **Create Backup**
```http
POST /api/backup/create
```

**Request Body:**
```json
{
  "type": "full",
  "includeFiles": true,
  "compression": true,
  "encryption": false
}
```

### **Restore Backup**
```http
POST /api/backup/restore
```

**Request Body:**
```json
{
  "backupId": "backup_123",
  "restoreOptions": {
    "users": true,
    "leads": true,
    "deals": true,
    "activities": true,
    "overwriteExisting": false
  },
  "confirm": true
}
```

---

## 🛡️ Security

### **Get Audit Logs**
```http
GET /api/security/audit-logs
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `action`: Filter by action
- `userId`: Filter by user
- `dateRange`: Date range filter

**Response:**
```json
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "id": "audit_id",
        "userId": "user_id",
        "action": "LOGIN_SUCCESS",
        "details": {
          "ip": "192.168.1.1",
          "userAgent": "Mozilla/5.0..."
        },
        "createdAt": "2026-01-15T10:30:00.000Z",
        "user": {
          "id": "user_id",
          "name": "John Doe"
        }
      }
    ],
    "statistics": [
      {
        "action": "LOGIN_SUCCESS",
        "count": 150
      }
    ],
    "recentSecurityEvents": [
      {
        "action": "LOGIN_FAILED",
        "count": 5
      }
    ]
  }
}
```

### **Two-Factor Authentication Setup**
```http
POST /api/auth/2fa/setup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "base32_secret_here",
    "qrCode": "data:image/svg+xml;base64,qr_code_data",
    "manualEntryKey": "BASE32 SECRET HERE",
    "instructions": {
      "step1": "Scan the QR code with your authenticator app",
      "step2": "Or manually enter the key in your app",
      "step3": "Enter the 6-digit code to verify and enable 2FA"
    }
  }
}
```

---

## ⚙️ Rate Limiting

### **Get Quota Status**
```http
GET /api/rate-limiting/quota
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "plan": "PRO",
      "quota": {
        "apiCallsPerMonth": 100000,
        "storageLimit": 1000
      },
      "currentUsage": {
        "apiCalls": 15000,
        "requests": 15000,
        "percentage": 15
      }
    },
    "rateLimits": {
      "endpoint": "default",
      "config": {
        "requestsPerMinute": 60,
        "requestsPerHour": 1000,
        "requestsPerDay": 10000
      },
      "status": {
        "minuteLimit": false,
        "hourLimit": false,
        "dayLimit": false
      },
      "remaining": {
        "minute": 45,
        "hour": 800,
        "day": 8000
      }
    }
  }
}
```

---

## 🌍 Internationalization

### **Get Translations**
```http
GET /api/i18n
```

**Query Parameters:**
- `lang`: Language code (en, es, fr, de, it, pt, ja, zh, ko)
- `namespace`: Translation namespace (common, navigation, auth, etc.)
- `keys`: Specific keys to retrieve

**Response:**
```json
{
  "success": true,
  "data": {
    "language": "en",
    "translations": {
      "common": {
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "edit": "Edit"
      }
    },
    "supportedLanguages": ["en", "es", "fr", "de", "it", "pt", "ja", "zh", "ko"],
    "defaultLanguage": "en"
  }
}
```

### **Set Language Preference**
```http
POST /api/i18n
```

**Request Body:**
```json
{
  "action": "set_language",
  "language": "es"
}
```

---

## 🏥 Health Monitoring

### **System Health**
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-15T10:30:00.000Z",
    "version": "3.0.0",
    "uptime": 86400,
    "services": {
      "database": "healthy",
      "api": "healthy",
      "auth": "healthy"
    }
  }
}
```

### **Memory Health**
```http
GET /api/health/memory
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "memory": {
      "heapUsed": 512,
      "heapTotal": 1024,
      "external": 256,
      "rss": 2048
    },
    "threshold": {
      "warning": 1536,
      "critical": 1792
    },
    "timestamp": "2026-01-15T10:30:00.000Z"
  }
}
```

---

## 📱 Mobile Responsive Design

### **Responsive Components**
The API provides data optimized for mobile consumption with:
- **Pagination**: Efficient data loading
- **Compression**: Reduced data transfer
- **Mobile-optimized**: Touch-friendly endpoints

### **Mobile-Specific Endpoints**
- **Real-time notifications**: Optimized for mobile push
- **Dashboard**: Mobile-optimized data structure
- **Search**: Mobile-friendly search results

---

## 🔧 Error Handling

### **Standard Error Response**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### **HTTP Status Codes**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

---

## 📚 SDK & Integration

### **JavaScript SDK Example**
```javascript
// Initialize client
const client = new FluentiveCRM({
  baseURL: 'https://your-domain.vercel.app/api',
  apiKey: 'your-api-key'
});

// Authentication
await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Get leads
const leads = await client.leads.list({
  page: 1,
  limit: 20,
  search: 'Acme'
});

// Create lead
const lead = await client.leads.create({
  name: 'New Company',
  email: 'contact@newcompany.com'
});
```

### **Webhook Integration**
```javascript
// Webhook payload example
{
  "event": "lead.created",
  "data": {
    "id": "lead_id",
    "name": "New Company",
    "email": "contact@newcompany.com",
    "createdAt": "2026-01-15T10:30:00.000Z"
  },
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

---

## 🚀 Rate Limits

### **Rate Limiting Rules**
- **Standard Endpoints**: 60 requests/minute
- **Heavy Endpoints**: 30 requests/minute
- **Auth Endpoints**: 20 requests/minute
- **Upload Endpoints**: 10 requests/minute
- **Burst Limit**: 10 requests per burst

### **Quota Management**
- **FREE Plan**: 10,000 API calls/month
- **PRO Plan**: 100,000 API calls/month
- **ENTERPRISE Plan**: 1,000,000 API calls/month

---

## 📞 Support

### **Documentation**
- **API Reference**: Complete API documentation
- **SDK Documentation**: Client library documentation
- **Integration Guides**: Step-by-step integration tutorials
- **Best Practices**: Usage recommendations

### **Support Channels**
- **Email**: support@fluentive.com
- **Documentation**: https://docs.fluentive.com
- **Community**: https://community.fluentive.com
- **Status Page**: https://status.fluentive.com

---

## 🎯 Getting Started

### **1. Get API Key**
1. Sign up for a Fluentive CRM account
2. Navigate to Settings > API Keys
3. Generate your API key
4. Copy your API key for use in requests

### **2. Make Your First Request**
```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### **3. Explore the API**
- Use the interactive API documentation
- Try the SDK examples
- Join the community for help

---

## 📊 API Usage Analytics

### **Monitoring Your Usage**
```http
GET /api/analytics/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentMonth": {
      "requests": 15000,
      "errors": 50,
      "averageResponseTime": 250
    },
    "quota": {
      "used": 15000,
      "limit": 100000,
      "percentage": 15
    },
    "topEndpoints": [
      {
        "endpoint": "/api/leads",
        "requests": 5000
      }
    ]
  }
}
```

---

## 🎉 Ready to Integrate!

Your Fluentive CRM API is now ready for integration. With comprehensive documentation, SDKs, and support, you can start building powerful CRM applications today.

**For more information, visit [https://docs.fluentive.com](https://docs.fluentive.com)**

---

*API Documentation Version: 3.0.0*
*Last Updated: January 15, 2026*
