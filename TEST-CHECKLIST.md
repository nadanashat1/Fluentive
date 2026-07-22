# 🧪 Fluentive Complete Test Checklist

## Quick Start
```bash
# Run automated API tests
npm run test:api

# Or test manually with curl
```

---

## 🔐 Authentication APIs

| Endpoint | Method | Test | Expected Result | Status |
|----------|--------|------|-----------------|--------|
| `/api/auth/login` | POST | Login with valid creds | 200 + token | ⬜ |
| `/api/auth/login` | POST | Login with invalid creds | 401 error | ⬜ |
| `/api/auth/register` | POST | Create new user | 201 + user data | ⬜ |
| `/api/auth/me` | GET | Get current user | 200 + user profile | ⬜ |
| `/api/auth/me` | GET | Without token | 401 error | ⬜ |
| `/api/auth/logout` | POST | Logout | 200 success | ⬜ |
| `/api/auth/change-password` | POST | Change password | 200 success | ⬜ |
| `/api/auth/2fa/verify` | POST | Verify 2FA | 200 success | ⬜ |
| `/api/auth/2fa/disable` | POST | Disable 2FA | 200 success | ⬜ |

**Test Commands:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# Get me (with token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Leads APIs

| Endpoint | Method | Test | Expected | Status |
|----------|--------|------|----------|--------|
| `/api/leads` | GET | Get all leads | 200 + leads array | ⬜ |
| `/api/leads` | POST | Create lead | 201 + lead data | ⬜ |
| `/api/leads/:id` | GET | Get lead by ID | 200 + lead data | ⬜ |
| `/api/leads/:id` | PATCH | Update lead | 200 + updated lead | ⬜ |
| `/api/leads/:id` | DELETE | Delete lead | 200 success | ⬜ |
| `/api/leads/:id/notes` | GET | Get lead notes | 200 + notes | ⬜ |
| `/api/leads/:id/notes` | POST | Add note | 201 + note data | ⬜ |
| `/api/leads/:id/attachments` | GET | Get attachments | 200 + files | ⬜ |
| `/api/v2/leads` | GET | Get leads v2 | 200 + leads | ⬜ |
| `/api/v2/leads` | POST | Create lead v2 | 201 + lead | ⬜ |

**Test Commands:**
```bash
# Get all leads
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Lead","email":"test@test.com","phone":"123","course":"Test","status":"new"}'
```

---

## 💼 Deals APIs

| Endpoint | Method | Test | Expected | Status |
|----------|--------|------|----------|--------|
| `/api/deals` | GET | Get all deals | 200 + deals array | ⬜ |
| `/api/deals` | POST | Create deal | 201 + deal data | ⬜ |
| `/api/deals/:id` | GET | Get deal by ID | 200 + deal data | ⬜ |

**Test Commands:**
```bash
# Create deal
curl -X POST http://localhost:3000/api/deals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"clientName":"Test","clientEmail":"test@test.com","stage":"qualification","priority":"hot"}'
```

---

## 👥 Users APIs

| Endpoint | Method | Test | Expected | Status |
|----------|--------|------|----------|--------|
| `/api/users` | GET | Get all users | 200 + users array | ⬜ |
| `/api/users/:id` | GET | Get user by ID | 200 + user data | ⬜ |
| `/api/users/:id` | PATCH | Update user | 200 + updated user | ⬜ |
| `/api/users/:id` | DELETE | Delete user | 200 success | ⬜ |
| `/api/users/:id/unlock` | POST | Unlock user | 200 success | ⬜ |

---

## 🔔 Notifications APIs

| Endpoint | Method | Test | Expected | Status |
|----------|--------|------|----------|--------|
| `/api/notifications` | GET | Get notifications | 200 + notifications | ⬜ |
| `/api/notifications/:id/read` | PATCH | Mark as read | 200 success | ⬜ |
| `/api/notifications/read-all` | PATCH | Mark all read | 200 success | ⬜ |
| `/api/notifications/:id` | DELETE | Delete notification | 200 success | ⬜ |

---

## ⏱️ Time Tracking APIs

| Endpoint | Method | Test | Expected | Status |
|----------|--------|------|----------|--------|
| `/api/time-tracking/my-time` | GET | Get my time | 200 + time data | ⬜ |
| `/api/time-tracking/active-users` | GET | Get active users | 200 + users | ⬜ |
| `/api/time-tracking/heartbeat` | POST | Send heartbeat | 200 success | ⬜ |
| `/api/time-tracking/activities` | GET | Get activities | 200 + activities | ⬜ |
| `/api/maintenance/my-stats` | GET | Get my stats | 200 + stats | ⬜ |

---

## 🏥 Health & System

| Endpoint | Method | Test | Expected | Status |
|----------|--------|------|----------|--------|
| `/api/health` | GET | Health check | 200 + status | ⬜ |

---

## 🎨 Frontend Pages

| Page | Test | Expected | Status |
|------|------|----------|--------|
| `/login` | Display & login | Form works, redirects | ⬜ |
| `/register` | Create account | Form works, success | ⬜ |
| `/dashboard` | View dashboard | Loads without errors | ⬜ |
| `/leads` | View leads | Table loads, data shows | ⬜ |
| `/leads/new` | Create lead | Form submits, redirects | ⬜ |
| `/leads/:id` | View lead detail | Details show, no errors | ⬜ |
| `/leads/:id/edit` | Edit lead | Updates save, redirects | ⬜ |
| `/sales-pipeline` | View pipeline | Deals show, kanban works | ⬜ |
| `/users` | View users | User list loads | ⬜ |
| `/settings` | View settings | Page loads, saves work | ⬜ |
| `/activity-logs` | View logs | Activities load | ⬜ |
| `/ai` | AI features | AI tools load | ⬜ |
| `/courses` | View courses | Course list loads | ⬜ |

---

## 🔧 Core Functionality

| Feature | Test Steps | Status |
|---------|------------|--------|
| **Dark Mode** | Toggle button, check all pages | ⬜ |
| **Auth Persistence** | Refresh page, stay logged in | ⬜ |
| **Logout** | Click logout, redirect to login | ⬜ |
| **Form Validation** | Submit empty form, show errors | ⬜ |
| **API Errors** | Disconnect network, show error | ⬜ |
| **Loading States** | Slow network, show loaders | ⬜ |
| **Notifications** | Get notification, mark as read | ⬜ |
| **Real-time Updates** | Check polling works (30s) | ⬜ |

---

## 🌐 Production Deployment Test

| Check | URL | Expected | Status |
|-------|-----|----------|--------|
| Site loads | `https://your-domain.vercel.app` | 200 OK | ⬜ |
| API responds | `/api/health` | `{status:"healthy"}` | ⬜ |
| Login works | `/api/auth/login` | Returns token | ⬜ |
| No console errors | Browser dev tools | Clean console | ⬜ |
| SEO meta tags | View page source | Proper meta tags | ⬜ |

---

## 🚀 How to Run Tests

### Automated Tests
```bash
# Run all API tests
npm run test:api

# Run with production URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app npm run test:api
```

### Manual Testing Script
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN=""

echo "=== Testing Health ==="
curl -s "$BASE_URL/api/health" | jq .

echo -e "\n=== Testing Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}')
echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

echo -e "\n=== Testing Get Leads ==="
curl -s "$BASE_URL/api/leads" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== Testing Create Lead ==="
curl -s -X POST "$BASE_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","email":"test@test.com","course":"Test","status":"new"}' | jq .
```

---

## ✅ Sign-off

- [ ] All Auth APIs work
- [ ] All Leads APIs work
- [ ] All Deals APIs work
- [ ] All Users APIs work
- [ ] All Notifications APIs work
- [ ] All Time Tracking APIs work
- [ ] Frontend pages load
- [ ] No console errors
- [ ] Production deployment tested

**Tester:** _______________  **Date:** _______________
