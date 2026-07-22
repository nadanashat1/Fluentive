# Vercel Deployment Guide

This guide will walk you through deploying the D-Fluency CRM to Vercel.

## Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [GitHub/GitLab/Bitbucket Account](https://github.com) (to import your project)
3. [PostgreSQL Database](https://vercel.com/storage/postgres) (Vercel Postgres or any external provider)

---

## Step 1: Deploy the Backend API

### 1.1 Create Backend Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`

### 1.2 Set Environment Variables

Go to **Settings > Environment Variables** and add these:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | Direct database URL (for Prisma) | Same as DATABASE_URL |
| `SHADOW_DATABASE_URL` | Shadow database for migrations | Same as DATABASE_URL |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `JWT_COOKIE_EXPIRE` | Cookie expiration (days) | `7` |
| `ALLOWED_ORIGINS` | Allowed frontend URLs | `https://your-frontend.vercel.app` |
| `FRONTEND_URL` | Frontend URL | `https://your-frontend.vercel.app` |
| `REDIS_URL` | Redis cache URL (optional) | `redis://localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |

### 1.3 Deploy Backend

Click **Deploy** and wait for the build to complete.

Copy your backend URL: `https://your-backend.vercel.app`

---

## Step 2: Deploy the Frontend

### 2.1 Create Frontend Project

1. In Vercel Dashboard, click **"Add New Project"**
2. Import the same Git repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (root)
   - **Build Command**: `next build`

### 2.2 Set Environment Variables

Go to **Settings > Environment Variables** and add:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-backend.vercel.app` |

### 2.3 Update vercel.json

Edit `vercel.json` in your project root and replace:
```json
"destination": "https://your-backend-url.vercel.app/api/$1"
```

With your actual backend URL:
```json
"destination": "https://d-fluency-backend.vercel.app/api/$1"
```

### 2.4 Deploy Frontend

Click **Deploy** and wait for the build.

---

## Step 3: Database Setup

### 3.1 Run Prisma Migrations (Local)

Run these commands locally with your DATABASE_URL set:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed  # if you have seed data
```

### 3.2 Using Vercel Postgres (Recommended)

1. Go to [Vercel Storage](https://vercel.com/storage)
2. Create a new Postgres database
3. Copy the connection strings
4. Add them to your backend environment variables

---

## Step 4: Verify Deployment

1. **Test Backend Health**:
   ```
   https://your-backend.vercel.app/health
   ```

2. **Test API**:
   ```
   https://your-backend.vercel.app/api/leads
   ```

3. **Test Frontend**:
   Open your frontend URL and verify everything works.

---

## Troubleshooting

### Build Failures

1. **Check TypeScript errors**:
   ```bash
   cd backend && npm run type-check
   ```

2. **Verify Prisma Client is generated**:
   ```bash
   cd backend && npx prisma generate
   ```

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database allows external connections
3. For Vercel Postgres, use the provided connection string

### CORS Errors

1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Check `FRONTEND_URL` is set correctly

### 404 Errors

1. Verify `vercel.json` rewrites are configured
2. Check backend is deployed and responding

---

## Important Notes

### File Uploads
File uploads to local filesystem won't work on serverless. Consider:
- Using Vercel Blob Storage
- AWS S3
- Cloudinary

Update the file upload code in `backend/src/controllers/leads.ts` to use cloud storage.

### WebSockets / Socket.IO
Socket.IO won't work on Vercel serverless functions. Consider:
- Using Vercel Realtime (paid feature)
- Pusher
- Ably
- Deploying to a serverful platform (Railway, Render, Digital Ocean)

### Scheduled Tasks (Cron Jobs)
Use Vercel Cron Jobs or external services like:
- GitHub Actions
- EasyCron
- Cron-job.org

---

## Alternative: Deploy Backend to Railway/Render

If you need WebSockets or file uploads, consider deploying the backend to:

- [Railway](https://railway.app) - Easy deployment with PostgreSQL
- [Render](https://render.com) - Free tier available
- [Digital Ocean](https://digitalocean.com) - Full control

Then update `NEXT_PUBLIC_API_URL` to point to your Railway/Render backend.

---

## Support

For issues or questions:
1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review [Prisma with Vercel Guide](https://www.prisma.io/docs/guides/deployment/serverless/deploy-to-vercel)
3. Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
