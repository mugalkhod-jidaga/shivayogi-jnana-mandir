# Backend — Divine Trust ERP

Express + TypeScript API for Phase 1.

## Setup

```bash
cp .env.example .env
# Fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from your Supabase dashboard
npm install
npm run dev
```

Health check: `GET http://localhost:4000/api/v1/health` → `{ "status": "ok" }`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled build |
| `npm run bootstrap` | One-time first Super Admin (after migrations + tenant INSERT) |
| `npm run test:me` | Sign in with bootstrap credentials and call `GET /users/me` (server must be running) |

## Phase B status

- [x] Express shell, helmet, CORS, rate limiters
- [x] `GET /api/v1/health`
- [x] `extractTenantMiddleware`, `requirePermission`, `AppError`
- [x] `BaseRepository`, `auditLogService`
- [x] `GET /api/v1/users/me`
- [x] `POST /api/v1/users/me/password-changed` — clear `must_reset_password` after staff sets new password

## Phase C — Staff / users (done)

- [x] `GET /api/v1/users` — paginated staff list
- [x] `POST /api/v1/users` — create staff (returns `meta.tempPassword`)
- [x] `GET /api/v1/users/:id`
- [x] `PATCH /api/v1/users/:id`
- [x] `PATCH /api/v1/users/:id/deactivate`
- [x] `POST /api/v1/users/:id/reset-password`
- [x] `GET /api/v1/roles`

Next: lookups module.

## Phase C — Lookups (done)

- [x] `GET /api/v1/lookups/blood-groups`
- [x] `GET /api/v1/lookups/admission-categories`
- [x] `GET /api/v1/lookups/document-types`
- [x] `POST /api/v1/lookups/admission-categories`
- [x] `PATCH /api/v1/lookups/admission-categories/:id`
- [x] `POST /api/v1/lookups/document-types`
- [x] `PATCH /api/v1/lookups/document-types/:id`

Next: students + family module.

## Students + family (done)

- [x] `GET /api/v1/students` — paginated list with field-level filtering
- [x] `POST /api/v1/students` — create student + family details
- [x] `GET /api/v1/students/:id` — detail (sensitive fields gated)
- [x] `PATCH /api/v1/students/:id` — update demographics / family / status
- [x] `PATCH /api/v1/students/:id/deactivate` — soft delete + status reason
- [x] `POST /api/v1/students/:id/avatar/presign` — R2 presigned upload (requires R2 env)
- [x] `POST /api/v1/students/:id/avatar/confirm` — save photo key

Next: documents + R2 module.

## Documents + R2 (done)

- [x] `GET /api/v1/students/:studentId/documents` — Finance role filter (Income + BPL only)
- [x] `POST /api/v1/students/:studentId/documents/presign` — R2 presigned PUT
- [x] `POST /api/v1/students/:studentId/documents/confirm` — create document record
- [x] `GET /api/v1/documents/:id/download` — presigned GET + audit log
- [x] `PATCH /api/v1/documents/:id/verify` — Verified / Rejected / Renewal Needed

### R2 bucket CORS (required for browser uploads)

Presign works from the API, but **avatar/document PUT from the browser** goes directly to `*.r2.cloudflarestorage.com`. That bucket must allow your frontend origin — this is separate from Express `CORS_ORIGIN`.

**Option A — Cloudflare dashboard (recommended)**

1. Cloudflare → **R2** → your bucket (`shivayogi-jnana-mandir-vault` or similar)
2. **Settings** → **CORS policy** → Edit
3. Paste the JSON from `backend/docs/r2-cors-policy.example.json` (add your production domain when deployed)
4. Save

**Option B — API script** (needs an R2 token with `Admin Read & Write` on the bucket)

```bash
npm run configure:r2-cors
```

Uses `CORS_ORIGIN` from `backend/.env` plus local Vite defaults.

After CORS is set, restart is not required — retry the avatar upload in the app.

Next: CSV migration module.

## Migration + Dashboard + Audit (done)

- [x] `POST /api/v1/migration/parse` — CSV/XLSX upload, validate, map lookups, preview
- [x] `POST /api/v1/migration/commit` — bulk insert via RPC
- [x] `GET /api/v1/dashboard/summary` — KPI counts
- [x] `GET /api/v1/dashboard/compliance-report` — missing documents per student
- [x] `GET /api/v1/audit-logs` — paginated audit trail

**Phase 1 backend API is complete.** Next: frontend scaffold.
