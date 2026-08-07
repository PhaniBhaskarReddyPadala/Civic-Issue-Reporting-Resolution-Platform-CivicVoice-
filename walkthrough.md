# CivicVoice — Deployment Walkthrough

## What Was Done

All code changes are complete and both builds pass with zero errors.

---

## Files Changed / Created

| File | Action | Purpose |
|---|---|---|
| [Dockerfile](file:///c:/Users/reddy/0projects/CivicVoice/Dockerfile) | Replaced | Multi-stage production build (builder → runner) |
| [.dockerignore](file:///c:/Users/reddy/0projects/CivicVoice/.dockerignore) | Created | Prevents secrets/node_modules leaking into build |
| [server.ts](file:///c:/Users/reddy/0projects/CivicVoice/backend/src/server.ts) | Modified | CORS locked to `FRONTEND_URL`, `/health` endpoint, `prisma.$connect()` on boot |
| [App.tsx](file:///c:/Users/reddy/0projects/CivicVoice/frontend/src/App.tsx) | Modified | Axios baseURL reads `VITE_API_URL` env var |
| [.env.production](file:///c:/Users/reddy/0projects/CivicVoice/frontend/.env.production) | Created | Placeholder for `VITE_API_URL` (update before deploy) |
| [package.json](file:///c:/Users/reddy/0projects/CivicVoice/package.json) | Modified | Added `build` script (compiles backend + frontend) |
| [render.yaml](file:///c:/Users/reddy/0projects/CivicVoice/render.yaml) | Created | Render IaC config (Docker service + env var declarations) |
| [vercel.json](file:///c:/Users/reddy/0projects/CivicVoice/frontend/vercel.json) | Created | SPA rewrite rule for React Router |

---

## Build Verification

```
✅ Backend (TypeScript → dist/)
   npm run build --prefix backend
   → tsc: 0 errors

✅ Frontend (Vite bundle)
   npm run build --prefix frontend
   → 1554 modules transformed
   → dist/assets/index.js: 279 kB (87 kB gzipped)
   → Built in 12.64s
```

---

## Manual Deployment Steps

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "chore: production deployment setup"
git push origin main
```

### Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Render will auto-detect `render.yaml` → confirm **Docker** runtime
4. In **Environment Variables**, add these secrets manually:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string (with `pgbouncer=true`) |
   | `MONGODB_URI` | Your MongoDB Atlas URI |
   | `JWT_SECRET` | Your JWT secret key |
   | `FRONTEND_URL` | *(set after Vercel deploy in Step 4)* |
   | `PORT` | `10000` |
   | `NODE_ENV` | `production` |

5. Click **Deploy** → wait ~3-5 min for Docker build
6. Copy your assigned URL: `https://civicvoice-backend.onrender.com`
7. Test: `GET https://civicvoice-backend.onrender.com/health` → should return `{"status":"ok"}`

### Step 3 — Update Frontend `.env.production`

Edit [frontend/.env.production](file:///c:/Users/reddy/0projects/CivicVoice/frontend/.env.production):
```
VITE_API_URL=https://civicvoice-backend.onrender.com
```
Commit and push.

> [!NOTE]
> Alternatively, set `VITE_API_URL` as an environment variable directly in the Vercel dashboard — this overrides the file and avoids committing Render URLs.

### Step 4 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite** (auto-detected)
4. Add environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://civicvoice-backend.onrender.com` |

5. Click **Deploy** → wait ~1 min
6. Copy your assigned URL: `https://civicvoice.vercel.app`

### Step 5 — Wire CORS on Render

Go back to Render → your service → **Environment** → add:

| Key | Value |
|---|---|
| `FRONTEND_URL` | `https://civicvoice.vercel.app` |

Click **Save** → Render will auto-redeploy. CORS is now locked to your Vercel domain only.

---

## Post-Deploy Checklist

- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] Login and Register work
- [ ] Citizen can submit a complaint
- [ ] Officer can update complaint status
- [ ] Refreshing `/officer` and `/complaints/:id` don't 404
- [ ] Browser DevTools shows no CORS errors
- [ ] Images upload (or gracefully fall back to base64 if Cloudinary not configured)

---

> [!TIP]
> **Free tier cold starts**: Render's free tier spins down after 15 minutes of inactivity. The first request after sleep may take 30-60s. Upgrade to Starter ($7/mo) or add an uptime monitor (e.g. UptimeRobot) pinging `/health` every 5 min to prevent cold starts.
