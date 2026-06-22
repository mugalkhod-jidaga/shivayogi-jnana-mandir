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

## Phase B status

- [x] Express shell, helmet, CORS, rate limiters
- [x] `GET /api/v1/health`
- [x] `extractTenantMiddleware`, `requirePermission`, `AppError`
- [x] `BaseRepository`, `auditLogService`
- [x] `GET /api/v1/users/me`

Next: staff/users module (Phase C).
