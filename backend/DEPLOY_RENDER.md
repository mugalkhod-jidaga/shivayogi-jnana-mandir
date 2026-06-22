# Deploy backend to Render

Web Service guide for [Render — New Web Service](https://dashboard.render.com/web/new?onboarding=active).

Express API in `backend/` — connects to **Supabase** (DB/auth) and **Cloudflare R2** (file uploads).

---

## Before you deploy

1. **Supabase migrations applied** — run SQL in `supabase/migrations/` on your Supabase project (if not already).
2. **First admin exists** — run locally once: `cd backend && npm run bootstrap` (needs `BOOTSTRAP_*` in `.env`).
3. **Cloudflare frontend URL** — you’ll need it for `CORS_ORIGIN` (Workers URL, e.g. `https://shivayogi-jnana-mandir.<account>.workers.dev`).

---

## Render dashboard — New Web Service

Connect your GitHub repo, then use:

| Field | Value |
|-------|--------|
| **Name** | `shivayogi-jnana-mandir-api` (or your choice) |
| **Region** | Singapore (or closest to your users) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | **Node** |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Instance type** | Free (dev) or Starter (always-on for production) |

### Health check (recommended)

In **Settings → Health Check Path**:

```
/api/v1/health
```

Expect: `{ "status": "ok" }`

Render sets **`PORT`** automatically — do **not** hard-code `4000` in Render env; the app reads `process.env.PORT`.

---

## Environment variables (Render → Environment)

Add these in the **Environment** tab. Mark secrets as **Secret**.

### Required

| Key | Example | Notes |
|-----|---------|--------|
| `NODE_ENV` | `production` | |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **Service role** — never expose to frontend |
| `CORS_ORIGIN` | `https://shivayogi-jnana-mandir.xxxx.workers.dev` | Your **Cloudflare Workers** frontend URL. Comma-separate multiple origins if needed. |

### Required for avatar/document uploads (R2)

| Key | Notes |
|-----|--------|
| `CLOUDFLARE_R2_ACCESS_KEY` | R2 → Manage R2 API tokens |
| `CLOUDFLARE_R2_SECRET_KEY` | |
| `CLOUDFLARE_R2_ENDPOINT` | e.g. `https://<accountid>.r2.cloudflarestorage.com` |
| `CLOUDFLARE_R2_BUCKET_NAME` | Your bucket name |

Without R2 vars, the API runs but presigned uploads fail.

### Optional (defaults are fine)

| Key | Default |
|-----|---------|
| `RATE_LIMIT_DEFAULT_MAX` | `60` |
| `RATE_LIMIT_LOGIN_MAX` | `5` |

Do **not** add `BOOTSTRAP_*` on Render unless you run bootstrap from a one-off shell — bootstrap is a **local one-time script**.

---

## After deploy succeeds

1. Copy your Render URL, e.g. `https://shivayogi-jnana-mandir-api.onrender.com`
2. Test health:
   ```bash
   curl https://shivayogi-jnana-mandir-api.onrender.com/api/v1/health
   ```
3. **Cloudflare frontend** — set build variable:
   ```text
   VITE_API_BASE_URL=https://shivayogi-jnana-mandir-api.onrender.com/api/v1
   ```
   Redeploy the frontend after changing this.
4. **R2 bucket CORS** — add your Workers frontend origin to the bucket CORS policy (see `docs/r2-cors-policy.example.json`). Browser uploads go to R2 directly, not through Render.

---

## Free tier notes

- Service **spins down** after ~15 min idle; first request may take 30–60s (cold start).
- For production demos, use **Starter** or accept cold starts.
- Supabase + R2 stay up; only the Render web process sleeps.

---

## Optional: Blueprint (`render.yaml`)

Repo root includes `render.yaml` for Infrastructure-as-Code. You can use **New → Blueprint** instead of manual setup — still add secret env vars in the dashboard after first deploy.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on `tsc` / `Cannot find type definition file for 'node'` | Set **Build Command** to `npm install --include=dev && npm run build` (Render skips devDeps when `NODE_ENV=production`) |
| Build fails on `tsc` (other) | Check Render build logs; ensure **Root Directory** = `backend` |
| `Invalid environment` / Zod error on start | Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` |
| CORS error from frontend | Add exact Workers URL to `CORS_ORIGIN` (no trailing slash) |
| 502 on health check | Wait for cold start; confirm **Start Command** = `npm start` |
| Uploads fail | R2 env vars + R2 bucket CORS for frontend origin |

---

## Wire-up checklist

```
[ ] Render web service live — GET /api/v1/health → ok
[ ] CORS_ORIGIN = Cloudflare Workers URL
[ ] VITE_API_BASE_URL = https://<render-host>/api/v1 (frontend rebuild)
[ ] R2 CORS includes Workers URL
[ ] Login works end-to-end in production
```
