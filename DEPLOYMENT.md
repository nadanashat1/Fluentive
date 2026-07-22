# Fluentive CRM - Production Deployment Guide

## 🚀 Quick Deploy (Vercel)

### Step 1: Environment Variables

Add these to your Vercel project settings:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# App URLs
FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# 2FA (Optional)
TWO_FACTOR_SECRET=your-2fa-secret-key
```

### Step 2: Deploy

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: GitHub Integration
# Push to main branch → Auto-deploys to Vercel
```

---

## 📋 Pre-Deploy Checklist

- [ ] Database migrated: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Environment variables configured
- [ ] Build passes locally: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🔧 Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🛡️ Security Checklist

- [ ] JWT_SECRET is 32+ characters
- [ ] Database uses SSL (Supabase default)
- [ ] No hardcoded secrets in code
- [ ] CORS configured in `vercel.json`
- [ ] Security headers active

---

## 📁 Project Structure

```
Fluentive/
├── app/                    # Next.js App Router
│   ├── api/               # 26 API routes
│   ├── (app)/             # Protected pages
│   └── ...
├── lib/
│   ├── prisma.ts          # Database client
│   └── server/            # Server utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── components/            # React components
├── hooks/                 # Custom hooks
└── public/               # Static assets
```

---

## 🔍 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Error
- Check `DATABASE_URL` format
- Ensure IP allowlist includes Vercel IPs
- Verify SSL mode is enabled

### API 404 Errors
- Check routes are in `app/api/**/route.ts`
- Verify file naming conventions

---

## 📊 API Routes (26 Total)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/me` | GET | Current user |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/2fa/verify` | POST | Verify 2FA |
| `/api/auth/2fa/disable` | POST | Disable 2FA |
| `/api/auth/change-password` | POST | Change password |
| `/api/leads` | GET/POST | List/Create leads |
| `/api/leads/[id]` | GET/PUT/DELETE | Single lead |
| `/api/leads/[id]/notes` | GET/POST | Lead notes |
| `/api/leads/[id]/notes/[noteId]` | DELETE | Delete note |
| `/api/leads/[id]/attachments/[attachmentId]` | DELETE | Delete attachment |
| `/api/deals/[id]` | GET | Single deal |
| `/api/notifications` | GET | User notifications |
| `/api/notifications/[id]` | PATCH/DELETE | Update/Delete notification |
| `/api/notifications/[id]/read` | PATCH | Mark as read |
| `/api/notifications/read-all` | PATCH | Mark all read |
| `/api/users` | GET | List users (admin) |
| `/api/users/[id]` | PUT/DELETE | Update/Delete user |
| `/api/users/[id]/unlock` | PUT | Unlock user |
| `/api/time-tracking/heartbeat` | POST | Activity heartbeat |
| `/api/time-tracking/my-time` | GET | User time stats |
| `/api/time-tracking/active-users` | GET | Active users |
| `/api/time-tracking/activities` | GET | Activity log |
| `/api/maintenance/my-stats` | GET | User statistics |
| `/api/health` | GET | Health check |

---

## ✅ Success Criteria

- [x] Single codebase fullstack app
- [x] All APIs working inside Next.js
- [x] No external backend required
- [x] Stable builds on Vercel
- [x] Zero functionality loss

---

**Deploy URL:** `https://your-app.vercel.app`
