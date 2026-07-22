# Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables Setup

#### Backend Environment Variables (Vercel Dashboard)
Copy these from `backend/.env.example`:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SHADOW_DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
ALLOWED_ORIGINS=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

#### Frontend Environment Variables (Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

### 2. Database Setup

Before deploying, run migrations:
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed  # optional
```

Or use Vercel Postgres:
1. Go to https://vercel.com/storage
2. Create Postgres database
3. Copy connection strings to env vars

### 3. Git Push
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

---

## Deployment Steps

### Backend Deployment

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
5. Add all environment variables from step 1
6. Click Deploy

### Frontend Deployment

1. In Vercel Dashboard, click "Add New Project" again
2. Import same repository
3. Configure:
   - **Root Directory**: `.` (root/leave empty)
   - **Framework Preset**: `Next.js`
   - **Build Command**: `next build`
4. Add `NEXT_PUBLIC_API_URL` with your backend URL
5. Update `vercel.json` with your actual backend URL:
   ```json
   "destination": "https://your-backend-url.vercel.app/api/$1"
   ```
6. Click Deploy

---

## Post-Deployment Verification

### Test Backend Health
```
https://your-backend.vercel.app/health
```

### Test API Endpoints
```
https://your-backend.vercel.app/api/leads
https://your-backend.vercel.app/api/auth/login
```

### Test Frontend
Open your frontend URL and verify:
- [ ] Login page loads
- [ ] Can authenticate
- [ ] Dashboard loads data
- [ ] Leads page works
- [ ] Sales pipeline works

---

## Known Limitations on Vercel

| Feature | Status | Workaround |
|---------|--------|------------|
| WebSockets/Socket.IO | ❌ Not supported | Use Pusher, Ably, or deploy to Railway |
| File uploads to disk | ❌ Not supported | Use S3, Cloudinary, or Vercel Blob |
| Long-running processes | ❌ Not supported | Break into smaller functions |
| Cron jobs | ⚠️ Limited | Use Vercel Cron or external service |

---

## Troubleshooting

### Build Failures
```bash
cd backend
npm run type-check  # Check for TypeScript errors
npm run build       # Test build locally
```

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check database allows external connections
3. For Vercel Postgres, use pooled connection string

### CORS Errors
1. Verify ALLOWED_ORIGINS includes frontend URL
2. Check backend is sending proper CORS headers
3. Ensure credentials: 'include' is set in frontend

### 404 Errors on API Routes
1. Check backend URL in frontend env vars
2. Verify backend deployment is successful
3. Test backend health endpoint

---

## Alternative: Full-Featured Deployment

For WebSockets and file uploads, deploy backend to Railway or Render:

### Railway (Recommended)
1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL plugin
4. Deploy from GitHub
5. Set environment variables
6. Get public URL and update frontend

### Render
1. Go to https://render.com
2. Create Web Service
3. Connect GitHub repo
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Add PostgreSQL database
7. Set environment variables

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/serverless/deploy-to-vercel)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
