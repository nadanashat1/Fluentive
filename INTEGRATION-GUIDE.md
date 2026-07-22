# Fluentive CRM - Complete Integration Guide

## 🎯 Overview

This guide covers the complete integration between the frontend and backend API we've built. All components are production-ready with comprehensive features.

## 🏗️ Architecture

### Backend (apps/api)
- **Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** with refresh tokens
- **Swagger Documentation** at `/api-docs`
- **Comprehensive API** covering all CRM features

### Frontend (src/)
- **Next.js 16** with React 19
- **TypeScript** throughout
- **API Client** with authentication
- **React Hooks** for state management
- **Tailwind CSS** for styling

## 🔗 API Integration

### 1. Environment Setup

#### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fluentive
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. API Client Usage

The enhanced API client provides:

#### Authentication
```typescript
import { useAuth } from '@/hooks/use-crm-api';

const { user, isAuthenticated, login, register, logout } = useAuth();

// Login
const result = await login('user@example.com', 'password');

// Register
const result = await register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'SALES'
});

// Logout
logout();
```

#### Leads Management
```typescript
import { useLeads, useCreateLead, useLead } from '@/hooks/use-crm-api';

// Get leads with pagination
const { data: leads, loading, error } = useLeads({ 
  page: 1, 
  limit: 10, 
  status: 'NEW' 
});

// Create new lead
const { createLead, loading, error } = useCreateLead();
const result = await createLead({
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1-555-0123',
  userId: 'user-id'
});

// Get single lead
const { data: lead, loading } = useLead('lead-id');
```

#### Deals Management
```typescript
import { useDeals, useCreateDeal, useDeal } from '@/hooks/use-crm-api';

// Get deals with filters
const { data: deals, loading } = useDeals({ 
  stage: 'OPEN',
  userId: 'user-id'
});

// Create new deal
const { createDeal, loading } = useCreateDeal();
const result = await createDeal({
  title: 'Enterprise Deal',
  value: 50000,
  stage: 'OPEN',
  userId: 'user-id',
  leadId: 'lead-id'
});
```

#### Dashboard & Analytics
```typescript
import { useDashboard, useRevenueAnalytics, useAiDashboard } from '@/hooks/use-crm-api';

// Dashboard summary
const { data: dashboard, loading } = useDashboard();

// Revenue analytics
const { data: revenue, loading } = useRevenueAnalytics('month');

// AI insights
const { data: aiInsights, loading } = useAiDashboard();
```

## 🚀 Quick Start

### 1. Start Backend
```bash
cd apps/api
npm install
npm run setup:db  # Setup database with sample data
npm run dev        # Start development server
```

### 2. Start Frontend
```bash
cd ..
npm install
npm run dev
```

### 3. Access Points
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api-docs
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:5000/health

## 🔐 Authentication Flow

### Login Process
1. User enters credentials in frontend
2. Frontend calls `apiClient.login()`
3. Backend validates credentials and returns JWT
4. Frontend stores token in localStorage
5. All subsequent requests include `Authorization: Bearer <token>`
6. Backend validates token and extracts user info

### Token Management
- **Access Token**: 24 hour expiry
- **Refresh Tokens**: 7 day expiry (implemented in schema)
- **Automatic Logout**: When token expires
- **Session Management**: Device tracking and revocation

## 📊 Features Integration

### Lead Management
- **CRUD Operations**: Create, read, update, delete leads
- **Search & Filter**: By name, email, status, date range
- **Pagination**: Efficient data loading
- **Status Tracking**: NEW → CONTACTED → QUALIFIED → LOST
- **Activity Logging**: Track all interactions with leads

### Deal Pipeline
- **Stage Management**: OPEN → WON → LOST
- **Value Tracking**: Deal values and revenue calculations
- **Lead Association**: Link deals to originating leads
- **Activity Integration**: Track deal-related activities

### AI Features
- **Lead Scoring**: AI-powered lead scoring (60-100 scale)
- **Revenue Forecasting**: Predictive analytics for future revenue
- **Priority Insights**: High-priority opportunities identification
- **Conversion Analytics**: Lead-to-deal conversion rates

### Dashboard Analytics
- **Real-time Metrics**: Live dashboard updates
- **Conversion Tracking**: Lead conversion rates and trends
- **Revenue Analytics**: Monthly, quarterly, annual revenue
- **Activity Monitoring**: User activity and engagement metrics

## 🧪 Testing Integration

### Backend Testing
```bash
cd apps/api

# Run comprehensive test suite
npm test

# Run API integration tests
npm run test:api

# Test specific endpoints
npm test -- --testNamePattern="Auth"
```

### Frontend Testing
```bash
# Run frontend tests
npm test

# Run E2E tests
npm run test:e2e
```

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build for production
cd apps/api
npm run build

# Deploy to production
npm start
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run deploy
```

### Environment Variables for Production
```env
# Backend
DATABASE_URL=postgresql://user:password@your-db-host:5432/fluentive
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## 📈 Monitoring & Logging

### Health Monitoring
- **Backend Health**: `/health` endpoint
- **Database Status**: Connection and query performance
- **API Performance**: Response times and error rates
- **Frontend Monitoring**: Error tracking and user analytics

### Logging Strategy
- **Backend Logs**: Structured logging with Winston
- **API Logs**: Request/response logging
- **Error Tracking**: Comprehensive error reporting
- **Database Logs**: Query performance monitoring

## 🔒 Security Implementation

### Authentication Security
- **JWT Tokens**: Secure token generation and validation
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **CORS Configuration**: Proper cross-origin setup

### Data Security
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Protection**: Input sanitization
- **CSRF Protection**: SameSite cookies and CSRF tokens

## 📚 API Documentation

### Swagger/OpenAPI
- **Interactive Docs**: http://localhost:5000/api-docs
- **Schema Documentation**: Complete API schemas
- **Authentication Examples**: Bearer token examples
- **Response Examples**: Success and error responses

### API Endpoints Reference
```
Authentication:
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
GET    /api/auth/me            - Get current user

Users:
GET    /api/users              - List users (admin/manager)
GET    /api/users/:id          - Get user by ID
PUT    /api/users/:id          - Update user
DELETE /api/users/:id        - Delete user (admin)

Leads:
GET    /api/leads              - List leads with pagination
GET    /api/leads/:id          - Get lead by ID
POST   /api/leads              - Create new lead
PUT    /api/leads/:id          - Update lead
DELETE /api/leads/:id        - Delete lead (soft delete)

Deals:
GET    /api/deals              - List deals with filters
GET    /api/deals/:id          - Get deal by ID
POST   /api/deals              - Create new deal
PUT    /api/deals/:id          - Update deal
DELETE /api/deals/:id        - Delete deal (soft delete)

Dashboard:
GET    /api/dashboard/summary   - Dashboard analytics
GET    /api/dashboard/revenue   - Revenue analytics

AI Features:
GET    /api/ai/dashboard        - AI insights
POST   /api/ai/score-lead      - Score lead
GET    /api/ai/advanced/revenue-forecast - Revenue forecast

Notifications:
GET    /api/notifications       - List notifications
POST   /api/notifications       - Create notification
PUT    /api/notifications/:id/read - Mark as read

Time Tracking:
GET    /api/time-tracking        - Get time tracking data
POST   /api/time-tracking/start  - Start tracking
PUT    /api/time-tracking/stop  - Stop tracking
```

## 🎯 Best Practices

### Code Organization
- **Separation of Concerns**: Clear API/client separation
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error management
- **Consistent Patterns**: Uniform API response format

### Performance Optimization
- **Database Indexes**: Optimized query performance
- **API Caching**: Redis for frequently accessed data
- **Lazy Loading**: Frontend code splitting
- **Bundle Optimization**: Production build optimization

### Security Best Practices
- **Environment Variables**: Never commit secrets
- **HTTPS Only**: Production SSL enforcement
- **Regular Updates**: Keep dependencies updated
- **Security Audits**: Regular security reviews

## 🚀 Next Steps

### Immediate Actions
1. **Setup Database**: Run `npm run setup:db` in backend
2. **Start Development**: Start both frontend and backend
3. **Test Integration**: Verify API connectivity
4. **Review Documentation**: Check API docs at `/api-docs`

### Production Readiness
1. **Environment Setup**: Configure production variables
2. **Database Migration**: Run Prisma migrations
3. **Testing**: Run comprehensive test suite
4. **Deployment**: Deploy to production environment
5. **Monitoring**: Set up production monitoring

## 🎉 Success Criteria

Your Fluentive CRM integration is complete when:

- ✅ Backend API running on port 5000
- ✅ Frontend running on port 3000
- ✅ Database connected with sample data
- ✅ Authentication flow working end-to-end
- ✅ Lead management fully functional
- ✅ Deal pipeline operational
- ✅ Dashboard displaying real data
- ✅ AI features providing insights
- ✅ API documentation accessible
- ✅ All tests passing

---

**🚀 Your Fluentive CRM is now fully integrated and ready for production deployment!**

For support: Check the API documentation at `http://localhost:5000/api-docs` or review the code in `apps/api/` and `src/` directories.
