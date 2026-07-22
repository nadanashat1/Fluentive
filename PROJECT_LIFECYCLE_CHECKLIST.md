# 🚀 PROJECT LIFECYCLE CHECKLIST — Dev → Launch → Growth

**Use this checklist throughout your project journey**

---

## 🧱 PHASE 1: DEVELOPMENT CHECK (Before Any Deploy)

### Backend
- [ ] All APIs working (test each endpoint)
- [ ] No errors in code (`npm run build` succeeds)
- [ ] All routes have validation (Zod schemas)
- [ ] Auth working (JWT tokens, login/register)
- [ ] Database queries optimized (Prisma, with `where` clauses)
- [ ] Tenant isolation verified (User A can't see User B's data)
- [ ] Error handling (no unhandled exceptions)
- [ ] Rate limiting configured

**Quick Test:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
# Should return: { success: true, token: "..." }
```

### Frontend
- [ ] All pages load without errors
- [ ] No console errors (F12 → Console)
- [ ] API calls working (Network tab shows 200s)
- [ ] Loading states exist (spinners/skeletons)
- [ ] Error states exist (error messages, not blank screens)
- [ ] Responsive design (works on mobile)

---

## 🧪 PHASE 2: FUNCTIONAL TESTING (Manual Hands-On)

### Core Flow Test
- [ ] Register new account
- [ ] Login with credentials
- [ ] Logout and login again
- [ ] Add data (create lead/deal/user)
- [ ] View data (list loads)
- [ ] Edit data (update works)
- [ ] Delete data (delete works)

### Error Handling Test
- [ ] Wrong password → clean error message (no crash)
- [ ] Invalid email format → validation error
- [ ] Missing required fields → form validation
- [ ] Network offline → error message shown
- [ ] Unauthorized access → 401 handled gracefully

### Edge Cases
- [ ] Special characters in input (', ", <, >)
- [ ] Very long text inputs
- [ ] Empty form submission
- [ ] Duplicate entries (same email twice)
- [ ] Rapid clicks (double-submit prevention)

---

## 🔐 PHASE 3: SECURITY CHECK

### Authentication
- [ ] No API open without auth (test with no token)
- [ ] Passwords hashed (bcrypt, not plain text)
- [ ] JWT secret is strong (32+ characters)
- [ ] JWT expiration set (not infinite)
- [ ] Refresh token mechanism (if using)

### Authorization
- [ ] Role-based access (admin vs user)
- [ ] Tenant isolation (strict `where: { tenantId }`)
- [ ] Users can't access others' data (test cross-tenant)

### Data Protection
- [ ] No sensitive data in logs
- [ ] No passwords in API responses
- [ ] SQL injection protected (Prisma handles this)
- [ ] XSS protection (React handles this, verify inputs)

### HTTPS & CORS
- [ ] HTTPS in production
- [ ] CORS configured correctly
- [ ] Secure cookies (if using)

---

## ⚡ PHASE 4: PERFORMANCE CHECK

### Frontend
- [ ] First page load < 3 seconds
- [ ] No layout shift (CLS < 0.1)
- [ ] Images optimized
- [ ] No unnecessary re-renders (React DevTools)

### Backend
- [ ] API response < 500ms (most endpoints)
- [ ] Database indexed (check Prisma schema)
- [ ] No N+1 queries (check Prisma logs)
- [ ] No memory leaks

### Network
- [ ] No duplicate API calls
- [ ] Proper caching headers
- [ ] Bundle size < 500KB (initial)

**Test Tools:**
- Chrome DevTools → Lighthouse
- Chrome DevTools → Network tab
- React DevTools Profiler

---

## 🧹 PHASE 5: CLEANUP (Critical)

### Code Cleanup
- [ ] Remove `console.log` (keep `console.error` for errors)
- [ ] Remove commented-out code blocks
- [ ] Remove unused imports
- [ ] Remove unused files/functions
- [ ] Delete mock data files

### Project Cleanup
- [ ] Delete `backend/` folder (after migration confirmed)
- [ ] Delete `old/` folder
- [ ] Delete `temp/` folder
- [ ] Delete `test-data/` folder

### Git Cleanup
- [ ] No sensitive data in git history
- [ ] `.env` in `.gitignore`
- [ ] Clean commit history (meaningful messages)

**Commands:**
```bash
# Find console.log
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "console.log"

# Find unused files
find src/ -type f -name "*.ts" | while read f; do
  filename=$(basename "$f" .ts)
  if ! grep -r "$filename" src/ > /dev/null 2>&1; then
    echo "Unused: $f"
  fi
done
```

---

## 📦 PHASE 6: BUILD CHECK

### Local Build
- [ ] `npm run build` succeeds
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors (or warnings reviewed)
- [ ] `dist/` or `.next/` folder created
- [ ] All files compiled

### Production Build
- [ ] Build with `NODE_ENV=production`
- [ ] Environment variables loaded
- [ ] No development dependencies in build
- [ ] Start script works: `npm start`

**Commands:**
```bash
npm run build
# Must show: "Compiled successfully" or "Build completed"
```

---

## 🌐 PHASE 7: DEPLOY CHECK

### Vercel (Frontend + API Routes)
- [ ] Project connected to GitHub
- [ ] Build settings correct
- [ ] Environment variables added
- [ ] Deploy succeeds (green checkmark)
- [ ] Site loads
- [ ] APIs respond

### Render / Railway (Backend)
- [ ] Service created
- [ ] Build command set: `npm install && npm run build`
- [ ] Start command set: `npm start`
- [ ] Environment variables configured
- [ ] Health check passes: `GET /api/health`
- [ ] Database connected

### Post-Deploy
- [ ] Site opens in browser
- [ ] Login works
- [ ] Dashboard loads
- [ ] Create lead works
- [ ] View logs — no errors

---

## 🔗 PHASE 8: DOMAIN + ENVIRONMENT

### Environment Variables
- [ ] `DATABASE_URL` set correctly
- [ ] `JWT_SECRET` set and strong
- [ ] `FRONTEND_URL` matches actual domain
- [ ] `API_URL` correct in frontend
- [ ] `NODE_ENV=production`
- [ ] No empty values

### Domain Setup (Optional)
- [ ] Custom domain connected (if using)
- [ ] SSL certificate active
- [ ] DNS configured correctly

### Integration
- [ ] Frontend can reach backend (CORS ok)
- [ ] Database accessible from backend
- [ ] External APIs working (OpenAI, Stripe, etc.)

---

## 🧠 PHASE 9: USER EXPERIENCE (UX)

### Navigation
- [ ] Clear menu/navigation
- [ ] Active page highlighted
- [ ] Breadcrumbs (if needed)
- [ ] Mobile menu works

### Forms
- [ ] Clear labels
- [ ] Validation messages helpful
- [ ] Submit button states (loading, success)
- [ ] Cancel/Back buttons where needed

### Feedback
- [ ] Success messages shown
- [ ] Error messages clear (not technical)
- [ ] Loading indicators
- [ ] Empty states ("No leads yet, add one!")

### Onboarding
- [ ] First-time user sees guidance
- [ ] Tooltips where needed
- [ ] Help text available

---

## 🚨 PHASE 10: ERROR HANDLING

### Backend Errors
- [ ] All errors caught (try/catch everywhere)
- [ ] No stack traces in production responses
- [ ] Consistent error format: `{ success: false, error: "..." }`
- [ ] 500 errors logged for monitoring

### Frontend Errors
- [ ] Error boundaries (React)
- [ ] Fallback UI for crashes
- [ ] Network error handling
- [ ] Timeout handling

### User-Facing Errors
- [ ] User sees friendly message (not "500 Internal Server Error")
- [ ] Suggested actions ("Try again", "Contact support")
- [ ] Error IDs for support (if needed)

---

## 📊 PHASE 11: MONITORING (After Launch)

### Error Monitoring
- [ ] Error tracking setup (Sentry or similar)
- [ ] Alerts for 500 errors
- [ ] Alerts for high error rate
- [ ] Daily error log review

### Performance Monitoring
- [ ] API response times tracked
- [ ] Database query performance
- [ ] Frontend load times
- [ ] Alerts for slowdowns

### Usage Monitoring
- [ ] Active users count
- [ ] Feature usage analytics
- [ ] Conversion tracking (signup → paid)
- [ ] Retention metrics

### Tools to Use
- [ ] Sentry (errors)
- [ ] LogRocket / FullStory (session replay)
- [ ] Google Analytics (usage)
- [ ] Vercel Analytics (performance)
- [ ] Render logs (backend)

---

## 🚀 PHASE 12: LAUNCH CHECKLIST (Launch Day)

### Before Launch
- [ ] Full system test one more time
- [ ] Delete all test data
- [ ] Database clean (reset if needed)
- [ ] Environment variables double-checked
- [ ] Backup created

### Launch Moment
- [ ] Deploy latest version
- [ ] Verify health check: `/api/health`
- [ ] Quick smoke test (login → dashboard)

### After Launch (First Hour)
- [ ] Open site from different device
- [ ] Test as new user (incognito mode)
- [ ] Watch error logs
- [ ] Monitor performance
- [ ] Check support channels

### First Day
- [ ] Watch for critical errors
- [ ] Respond to user feedback
- [ ] Monitor server load
- [ ] Check database connections

---

## 💰 PHASE 13: FIRST USERS READY

### Onboarding Flow
- [ ] Signup process smooth
- [ ] Welcome email sent (if applicable)
- [ ] First-run tutorial/tooltips
- [ ] Sample data (optional) to show features

### Core Value
- [ ] User can achieve main goal in < 5 minutes
- [ ] Clear value proposition
- [ ] No confusion on "what to do next"

### Support Ready
- [ ] Contact form works
- [ ] FAQ page (optional)
- [ ] Quick response time promised

### Feedback Loop
- [ ] Feedback button available
- [ ] NPS survey (optional, after 7 days)
- [ ] Analytics to see where users drop off

---

## 🔥 PHASE 14: GROWTH MODE (Post-Launch)

### Week 1-2: Stability
- [ ] No critical bugs
- [ ] Performance optimized
- [ ] All user-reported issues fixed

### Month 1: Iteration
- [ ] User feedback collected
- [ ] Top requested features identified
- [ ] Quick wins implemented
- [ ] A/B tests (optional)

### Month 2-3: Scale
- [ ] Database optimized for scale
- [ ] Caching implemented (Redis)
- [ ] CDN for static assets
- [ ] Load testing done

### Ongoing
- [ ] Feature releases (weekly/bi-weekly)
- [ ] Changelog maintained
- [ ] User communication (email/announcements)
- [ ] Competitive analysis

---

## ✅ FINAL SIGN-OFF

Before declaring "READY":

### Must Be True:
- [ ] All Phase 1-10 items checked
- [ ] No known bugs
- [ ] Build succeeds
- [ ] Deploy working
- [ ] Tested by real person (not just developer)

### Sign-Off:
```
Project: Fluentive
Status: READY FOR LAUNCH
Date: ___________
Signed: ___________
```

---

## 🆘 EMERGENCY CONTACTS

| Role | Name | Contact |
|------|------|---------|
| Tech Lead | | |
| DevOps | | |
| Support | | |

---

## 🎯 NEXT PHASE?

**Say "next phase" for:**
- 💰 SaaS Pricing System
- 👥 Advanced User Roles & Permissions
- 📊 Admin Dashboard & Analytics
- 🔒 Advanced Security Features
- 🚀 Performance Optimization
- 📧 Email Marketing Integration

---

**Last Updated:** Auto-generated
**Version:** 1.0.0
**Status:** Template — Fill in as you progress
