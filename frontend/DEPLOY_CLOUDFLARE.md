# Deploy frontend to Cloudflare Workers

This app is a **static Vite SPA**. Cloudflare serves `frontend/dist` via Workers static assets (`wrangler.toml`).

## Cloudflare dashboard — Workers Builds (Git)

When connecting your GitHub repo, use these settings:

| Field | Value |
|-------|--------|
| **Project name** | `shivayogi-jnana-mandir` (or your choice) |
| **Root directory** | `frontend` |
| **Production branch** | `main` (or your default branch) |
| **Build command (production)** | `npm ci && npm run deploy` |
| **Build command (preview branches)** | `npm ci && npm run deploy:preview` |

If the UI splits “build” and “deploy”, use:

- Build: `npm ci && npm run build`
- Deploy: `npx wrangler deploy` (production) / `npx wrangler versions upload` (preview)

### API token (`create_new_token`)

Click **Create new token** and let Cloudflare generate it. That creates **`CLOUDFLARE_API_TOKEN`** automatically — you do **not** paste a token manually unless you use a custom one.

Required token permissions (auto templates usually include these):

- Account → Workers Scripts → Edit
- Account → Workers KV / R2 → Edit (if prompted; optional for static-only)

### Environment variables (required at build time)

Vite embeds these into the JS bundle during `npm run build`. Add them in **Settings → Variables and secrets → Build** (or “Environment variables” in the Workers Builds wizard):

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | **Anon/public key only** — never service role |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com/api/v1` | Your **production** backend URL |

Copy values from local `frontend/.env`, but change `VITE_API_BASE_URL` from `localhost` to the live API.

### After first deploy

1. Note your Worker URL, e.g. `https://shivayogi-jnana-mandir.<account>.workers.dev`
2. **Backend** — add that origin to `CORS_ORIGIN` in backend `.env` / hosting env
3. **Supabase** — Auth → URL configuration: add the Worker URL to allowed redirect/site URLs if you use OAuth (phone OTP usually fine without extra redirects)
4. **R2 CORS** — if uploading avatars/documents from the browser, allow the Worker origin on the R2 bucket (see `backend/docs/r2-cors-policy.example.json`)

## Deploy from your machine (optional)

```bash
cd frontend
cp .env.example .env   # fill production values
npm install
npm run deploy
```

First time: `npx wrangler login`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / 404 on refresh | `wrangler.toml` must have `not_found_handling = "single-page-application"` (already set) |
| “Missing env” / login broken | Set all three `VITE_*` vars in Cloudflare **build** env, then redeploy |
| API CORS errors | Add Workers URL to backend `CORS_ORIGIN` |
| R2 upload fails | Configure R2 bucket CORS for the Workers origin (separate from Express CORS) |

Backend deployment is separate (Railway, Fly.io, VPS, etc.) — the frontend only talks to it via `VITE_API_BASE_URL`.
