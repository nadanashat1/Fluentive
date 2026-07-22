# 🔒 SECURITY TEST CASES - Enterprise Verification

## 📋 Test Matrix

### 1. Authentication Bypass Tests

#### ✅ Test 1.1: Unauthorized API Access
**Objective**: Verify all protected endpoints reject unauthenticated requests

**Commands**:
```bash
# Test without authentication
curl -X GET http://localhost:3000/api/users
curl -X GET http://localhost:3000/api/organizations
curl -X GET http://localhost:3000/api/time-tracking/all-time
curl -X POST http://localhost:3000/api/organizations/invitations \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "role": "SALES"}'
```

**Expected Results**:
- Status: 401 Unauthorized
- Response: `{ success: false, message: 'Unauthorized' }`

#### ✅ Test 1.2: Invalid Token Access
**Objective**: Verify endpoints reject invalid JWT tokens

**Commands**:
```bash
# Test with invalid token
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Results**:
- Status: 401 Unauthorized

#### ✅ Test 1.3: Expired Token Access
**Objective**: Verify endpoints reject expired tokens

**Commands**:
```bash
# Test with expired token (use old token)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <expired-token>"
```

**Expected Results**:
- Status: 401 Unauthorized
- Auto token refresh attempt should be visible in logs

---

### 2. Authorization & RBAC Tests

#### ✅ Test 2.1: Non-Admin Access to Admin Endpoints
**Objective**: Verify regular users cannot access admin-only endpoints

**Setup**: Create a regular user with SALES role
**Commands**:
```bash
# Login as sales user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sales@example.com", "password": "password123"}'

# Use returned token to access admin endpoints
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <sales-user-token>"

curl -X DELETE http://localhost:3000/api/users/<admin-user-id> \
  -H "Authorization: Bearer <sales-user-token>"
```

**Expected Results**:
- Status: 403 Forbidden
- Response: `{ success: false, message: 'Forbidden: Requires users.manage permission' }`

#### ✅ Test 2.2: Manager Access to Admin-Only Features
**Objective**: Verify managers cannot perform admin-only actions

**Setup**: Create a user with MANAGER role
**Commands**:
```bash
# Login as manager
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@example.com", "password": "password123"}'

# Try to delete users (admin only)
curl -X DELETE http://localhost:3000/api/users/<some-user-id> \
  -H "Authorization: Bearer <manager-token>"
```

**Expected Results**:
- Status: 403 Forbidden

#### ✅ Test 2.3: Cross-Tenant Data Access
**Objective**: Verify users cannot access data from other organizations

**Setup**: Two users from different organizations
**Commands**:
```bash
# User from Org A tries to access Org B data
curl -X GET http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <org-a-user-token>"
```

**Expected Results**:
- Should only return user's own organization data
- Status: 200 but with filtered/empty data for unauthorized access

---

### 3. Rate Limiting Tests

#### ✅ Test 3.1: Login Rate Limiting
**Objective**: Verify brute force protection is working

**Commands**:
```bash
# Attempt 6 failed logins within 15 minutes
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpassword"}'
  sleep 1
done
```

**Expected Results**:
- First 5 attempts: Status 401 with normal response
- 6th attempt: Status 429 Too Many Requests
- Response: `{ success: false, error: 'Too many authentication attempts...' }`
- Headers: `Retry-After`, `X-RateLimit-Limit: 5`

#### ✅ Test 3.2: API Rate Limiting
**Objective**: Verify general API rate limiting

**Commands**:
```bash
# Make 101 rapid requests
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/leads \
    -H "Authorization: Bearer <valid-token>"
done
```

**Expected Results**:
- First 100 requests: Status 200
- 101st request: Status 429

---

### 4. Input Validation & Injection Tests

#### ✅ Test 4.1: SQL Injection Attempts
**Objective**: Verify SQL injection protection

**Commands**:
```bash
# Test various SQL injection payloads
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin'; DROP TABLE users; --", "password": "password"}'

curl -X GET "http://localhost:3000/api/users?search=admin'%20OR%201=1--"
```

**Expected Results**:
- Status: 400/401 (malformed input rejected)
- No database errors leaked
- Application logs should show injection attempt

#### ✅ Test 4.2: XSS Attempts
**Objective**: Verify XSS protection

**Commands**:
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(\"XSS\")</script>", "email": "test@example.com"}'
```

**Expected Results**:
- Input sanitized or rejected
- Status: 400 (validation error)
- No script execution in database

---

### 5. Session Management Tests

#### ✅ Test 5.1: Session Fixation
**Objective**: Verify session tokens cannot be hijacked

**Commands**:
```bash
# Try to use old session token after logout
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <old-session-token>"
```

**Expected Results**:
- Status: 401 Unauthorized
- Old token should be invalid

#### ✅ Test 5.2: Concurrent Session Limits
**Objective**: Verify multiple concurrent sessions are handled properly

**Commands**:
```bash
# Login from multiple devices simultaneously
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  --cookie-jar session1.txt

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  --cookie-jar session2.txt
```

**Expected Results**:
- Both sessions should work (if allowed) or older session invalidated
- Consistent behavior across sessions

---

### 6. Audit & Logging Tests

#### ✅ Test 6.1: Admin Action Logging
**Objective**: Verify all admin actions are logged

**Commands**:
```bash
# Perform admin action
curl -X DELETE http://localhost:3000/api/users/<test-user-id> \
  -H "Authorization: Bearer <admin-token>"

# Check audit logs
curl -X GET http://localhost:3000/api/v2/security-log/list \
  -H "Authorization: Bearer <admin-token>"
```

**Expected Results**:
- Action logged in SecurityLog table
- Log contains: userId, action, resource, timestamp, IP
- Console shows: `[AUDIT] USER_DELETED:user by admin@example.com`

#### ✅ Test 6.2: Security Event Logging
**Objective**: Verify security events are captured

**Commands**:
```bash
# Trigger security event (failed login)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "wrongpassword"}'
```

**Expected Results**:
- Failed login logged
- Rate limit counters updated
- IP address recorded

---

### 7. Frontend Protection Tests

#### ✅ Test 7.1: Route Guard Bypass
**Objective**: Verify frontend routes are protected

**Manual Tests**:
1. Clear browser cookies/storage
2. Try to access: `http://localhost:3000/dashboard/users`
3. Try to access: `http://localhost:3000/dashboard`

**Expected Results**:
- Redirect to `/login?next=<original-url>`
- No dashboard content visible without authentication

#### ✅ Test 7.2: Permission-Based UI Hiding
**Objective**: Verify UI elements are hidden based on permissions

**Manual Tests**:
1. Login as SALES user
2. Navigate to dashboard
3. Check for admin-only elements

**Expected Results**:
- No "Users Management" menu item
- No admin buttons visible
- Only sales-related features accessible

---

## 🎯 PASS/FAIL CRITERIA

### ✅ PASS if:
- All 401 tests return proper authentication errors
- All 403 tests return proper permission errors  
- Rate limiting activates at correct thresholds
- Input validation blocks malicious payloads
- Audit logs capture all sensitive actions
- Frontend redirects work correctly
- No database errors or stack traces leaked

### ❌ FAIL if:
- Any protected endpoint accessible without auth
- Users can access features beyond their role
- Rate limiting can be bypassed
- Malicious input reaches database
- Admin actions not logged
- Frontend routes accessible without login
- Any error messages leak sensitive information

---

## 🚀 Automated Test Script

```bash
#!/bin/bash
# Run all security tests automatically
echo "🔒 Starting Security Audit..."

# Test 1: Authentication
echo "Testing Authentication..."
./test-auth.sh

# Test 2: Authorization  
echo "Testing Authorization..."
./test-rbac.sh

# Test 3: Rate Limiting
echo "Testing Rate Limiting..."
./test-rate-limit.sh

# Test 4: Input Validation
echo "Testing Input Validation..."
./test-input-validation.sh

echo "✅ Security Audit Complete!"
```

---

## 📊 Test Results Template

```
SECURITY AUDIT REPORT
==================

Authentication Tests:     PASS/FAIL     (X/X)
Authorization Tests:      PASS/FAIL     (X/X)  
Rate Limiting Tests:      PASS/FAIL     (X/X)
Input Validation Tests:    PASS/FAIL     (X/X)
Audit Logging Tests:       PASS/FAIL     (X/X)
Frontend Protection:      PASS/FAIL     (X/X)

OVERALL SECURITY:         PASS/FAIL

CRITICAL ISSUES:
- [List any critical failures]

RECOMMENDATIONS:
- [List any security improvements needed]
```
