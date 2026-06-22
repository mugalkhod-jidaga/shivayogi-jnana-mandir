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
