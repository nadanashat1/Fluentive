Please design and implement a full CRM backend and dashboard system based on current stable auth system.
Follow these strict rules:

1. Architecture rules (MANDATORY)
- Use service layer (no business logic inside routes)
- Never return raw Prisma models
- Always use toPublicUser or equivalent serializers
- Separate:
  - routes
  - services
  - database (Prisma)
- All APIs must return consistent JSON shape

2. Implement these modules step-by-step (DO NOT MIX THEM)

Module 1: Users Management
- GET /api/users
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id
- Role-based access (ADMIN only)

Module 2: Leads System
Create Lead model:
- id
- name
- email
- phone
- status (NEW, CONTACTED, QUALIFIED, LOST)
- assignedTo (User)
- createdAt

APIs:
- POST /api/leads
- GET /api/leads
- PATCH /api/leads/:id
- DELETE /api/leads/:id

Module 3: Deals / Pipeline
- id
- title
- value
- stage (OPEN, WON, LOST)
- leadId
- ownerId

APIs:
- POST /api/deals
- GET /api/deals
- PATCH /api/deals/:id

Module 4: Dashboard APIs
Create aggregated endpoints:
- GET /api/dashboard/metrics
Return:
- total users
- total leads
- conversion rate
- deals won value

Module 5: Activity Logs
Track:
- login
- create lead
- update deal

API:
- GET /api/activity

3. Monitoring & Stability
Add:
- /api/health (already exists, keep it)
- /api/metrics (response time, db latency)
- error logging middleware

4. Frontend Dashboard (Next.js)
Create pages:
- /dashboard
- /dashboard/leads
- /dashboard/deals
- /dashboard/users

Requirements:
- use server components where possible
- clean UI (cards, tables)
- loading states
- error states

5. Security
- protect all routes with auth middleware
- restrict admin routes
- sanitize all outputs
- never expose sensitive fields

6. DO NOT:
- break existing auth system
- modify login/register logic
- introduce duplicate logic
- return raw DB objects

Return:
- folder structure
- Prisma schema updates
- API implementation
- dashboard UI
