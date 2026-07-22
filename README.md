# D Fluency CRM Frontend

## Run locally

```bash
npm install
npm run dev
```

`npm run dev` is the recommended single command. It now:
- starts backend first on `http://localhost:5000`
- waits until backend health is ready (`/health`)
- then starts frontend (prefers `3000`, auto-picks another free port if needed)

## Dev workflow notes (Windows)

- **Use one entrypoint**: run `npm run dev` **from the repo root**. This starts:
  - Backend (Express) on `http://localhost:5000` first
  - Frontend (Next.js) after backend readiness check
- **Avoid running backend separately** while `npm run dev` is active (that's the common cause of `Port 5000 is already in use`).
- **If port 5000 is busy**, the dev runner fails fast with guidance.
- **If port 3000 is busy**, frontend auto-selects the next free port.
- To inspect who holds a port:

```bash
node scripts/ports.js 5000
node scripts/ports.js 3000
```

- **If you used Docker Compose before**, stop containers first because `docker-compose.yml` maps `5000:5000`:
  - `docker compose down`

## Deploy to Vercel

### Quick Deploy

1. **Prepare for deployment:**
   ```bash
   node scripts/prepare-for-deploy.js
   ```

2. **Deploy Backend:**
   - Go to [vercel.com](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repo
   - Set **Root Directory** to `backend`
   - Add environment variables (see `backend/.env.example`)
   - Deploy

3. **Deploy Frontend:**
   - In Vercel, click "Add New Project" again
   - Import same repo
   - Set **Root Directory** to `.` (root)
   - Add `NEXT_PUBLIC_API_URL` = your backend URL
   - Deploy

### Detailed Instructions

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment guide.

See [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) for step-by-step checklist.
