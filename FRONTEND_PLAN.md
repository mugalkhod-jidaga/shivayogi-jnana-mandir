# Frontend Plan — Shivayogi Jnana Mandir ERP

**Status:** Not started (only `frontend/.env.example` exists)  
**Backend:** Phase 1 API complete — frontend can be built against `http://localhost:4000/api/v1`  
**Spec reference:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) Section 17

---

## Principles

1. **One vertical slice at a time** — scaffold → auth → shell → students → … (don't build all pages at once).
2. **Mirror backend permissions** — use `GET /users/me` permissions for nav, buttons, and field visibility.
3. **Auth on Supabase client** — login/password reset via `@supabase/supabase-js`; everything else via Express API + Bearer token.
4. **Reuse Zod shapes** — copy/adapt validation from `backend/src/modules/*/schemas` so FE and BE stay aligned.

---

## Prerequisites (before FE-0)

| Item | Action |
|------|--------|
| `frontend/.env` | Copy from `.env.example` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` |
| Backend running | `cd backend && npm run dev` on port 4000 |
| Supabase Auth | Phone provider enabled; test admin can log in |
| CORS | `backend/.env` `CORS_ORIGIN=http://localhost:5173` |

---

## Phase FE-0 — Project scaffold (~1 session)

**Goal:** Empty app compiles, styled, with folder structure ready.

### Steps

1. **Create Vite app** in `frontend/`:
   ```bash
   npm create vite@latest . -- --template react-ts
   npm install
   ```
2. **Tailwind CSS** — init + `tailwind.config` content paths for `src/`.
3. **shadcn/ui** — `npx shadcn@latest init` (New York style, zinc slate, CSS variables).
4. **Core deps:**
   ```bash
   npm install react-router-dom @tanstack/react-query @supabase/supabase-js zod react-hook-form @hookform/resolvers
   ```
5. **Folder structure:**
   ```text
   frontend/src/
     components/     # shadcn + shared (Layout, PageHeader, DataTable)
     features/       # auth, students, documents, staff, lookups, import, dashboard
     hooks/          # useAuth, usePermissions, useApi
     lib/            # supabase.ts, api.ts, utils.ts
     routes/         # AppRoutes, ProtectedRoute, RequirePermission
     types/          # MeResponse, Student, Document, etc.
   ```
6. **Verify:** `npm run dev` → blank page at `http://localhost:5173`.

### Done when

- [ ] TypeScript strict build passes
- [ ] Tailwind + one shadcn `Button` renders
- [ ] `.env` loaded via `import.meta.env.VITE_*`

---

## Phase FE-1 — Authentication (~1 session)

**Goal:** Staff can log in, session persists, forced password reset works.

### Steps

1. **`lib/supabase.ts`** — `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`.
2. **`features/auth/LoginPage.tsx`**
   - Phone + password form (React Hook Form + Zod).
   - `supabase.auth.signInWithPassword({ phone, password })`.
   - Normalize phone to E.164 before submit (`+91` + 10 digits).
3. **`features/auth/ResetPasswordPage.tsx`**
   - After login, if `mustResetPassword` from `/users/me` → redirect here.
   - `supabase.auth.updateUser({ password })` then call backend or re-fetch `/users/me`.
4. **`hooks/useAuth.ts`**
   - Subscribe to `supabase.auth.onAuthStateChange`.
   - Expose `session`, `signOut`, `getAccessToken()`.
5. **`ProtectedRoute`** — no session → `/login`.

### API used

- None for login (Supabase only).
- `GET /users/me` after login to load profile + `mustResetPassword`.

### Done when

- [ ] Admin logs in with bootstrap credentials
- [ ] Invalid credentials show error toast
- [ ] Logout clears session and returns to `/login`
- [ ] `must_reset_password` flow blocks app until new password set

---

## Phase FE-2 — API client + app shell (~1 session)

**Goal:** Authenticated layout with role-aware sidebar.

### Steps

1. **`lib/api.ts`**
   - `apiFetch(path, options)` attaches `Authorization: Bearer <token>`.
   - On `401` + `error === 'TOKEN_EXPIRED_OR_INVALID'` → `refreshSession()` once → retry.
   - On refresh failure → redirect `/login`.
   - Standard response typing: `{ success, data?, error?, meta? }`.
2. **`hooks/useMe.ts`** — TanStack Query `GET /users/me`, cache 5 min.
3. **`hooks/usePermissions.ts`** — `hasPermission('students:read')` helper.
4. **`components/RequirePermission.tsx`** — hide children or redirect if missing permission.
5. **`components/Layout.tsx`**
   - Sidebar nav (items from Section 17.2 table).
   - Top bar: user name, role badge, logout.
   - `<Outlet />` for child routes.
6. **`routes/AppRoutes.tsx`** — wire public vs protected routes.

### Nav items (permission-gated)

| Label | Route | Permission |
|-------|-------|------------|
| Dashboard | `/` | `dashboard:view` |
| Students | `/students` | `students:read` |
| Documents | `/documents` | `documents:view` |
| Bulk Import | `/import` | `students:create` |
| Staff | `/staff` | `system:manage_roles` |
| Lookups | `/lookups` | `system:manage_lookups` |
| Audit Logs | `/audit-logs` | `audit_logs:view` |

### Done when

- [ ] Sidebar shows only permitted items for Super Admin
- [ ] Teacher/Warden account (when created) sees only Students
- [ ] All routes render placeholder pages inside layout

---

## Phase FE-3 — Lookups (shared data) (~½ session)

**Goal:** Lookup data available for forms across the app.

### Steps

1. **`hooks/useLookups.ts`** — parallel queries:
   - `GET /lookups/blood-groups`
   - `GET /lookups/admission-categories`
   - `GET /lookups/document-types`
2. **Shared `Select` components** for blood group, admission category, document type.

### Done when

- [ ] Lookups load once and cache via TanStack Query
- [ ] Used in a test dropdown on a dev page (or skip to FE-4)

---

## Phase FE-4 — Students module (~2 sessions)

**Goal:** Full student CRUD for admissions staff.

### Screens

| Route | Component | API |
|-------|-----------|-----|
| `/students` | `StudentListPage` | `GET /students?page&limit&search` |
| `/students/new` | `StudentFormPage` | `POST /students` |
| `/students/:id` | `StudentDetailPage` | `GET /students/:id` |
| `/students/:id/edit` | `StudentFormPage` | `PATCH /students/:id` |

### Steps

1. **List page** — search input, pagination, status badges (Active / Alumni / Discontinued).
2. **Form page** — sections:
   - Demographics (admission #, name, DOB, gender, blood group, category, medical alerts).
   - Family (hidden entirely if no `students:view_sensitive_data`).
   - Phone fields normalize to E.164 on submit.
3. **Detail page** — tabs:
   - **Profile** — read-only summary.
   - **Documents** — embedded list (FE-5) or link.
   - **Avatar** — upload widget (presign → PUT R2 → confirm).
4. **Deactivate** — dialog with required `statusReason`; `PATCH /students/:id/deactivate`.
5. **Create button** — gated by `students:create`.

### Done when

- [ ] Create, list, search, view, edit, deactivate work end-to-end
- [ ] Teacher sees list/detail **without** family section
- [ ] Admissions clerk sees full family fields

---

## Phase FE-5 — Documents module (~1–2 sessions)

**Goal:** Upload, list, download, verify documents per student.

### Screens

| Route | Component | API |
|-------|-----------|-----|
| `/students/:id` (Documents tab) | `StudentDocumentsTab` | list, presign, confirm |
| `/documents` | `DocumentQueuePage` | cross-student pending queue (optional aggregate) |

### Upload flow (per file)

```
POST .../documents/presign  →  uploadUrl, key
PUT uploadUrl (binary)      →  R2
POST .../documents/confirm  →  DB row
```

### Steps

1. **Document list** on student detail — type, status, uploaded date.
2. **Upload dropzone** — `documents:upload` permission.
3. **Download button** — `GET /documents/:id/download` → open presigned URL.
4. **Verify actions** — Verified / Rejected / Renewal Needed (`PATCH /documents/:id/verify`).
5. **Finance role** — only Income Certificate + BPL appear (backend filters; FE just renders what API returns).
6. **Global queue** `/documents` — filter `Pending Review` (client-side filter on fetched data or future aggregate endpoint).

### Done when

- [ ] PDF/image uploads to R2 and appears in list
- [ ] Super Admin can verify/reject
- [ ] Finance user only sees allowed document types

---

## Phase FE-6 — Staff admin (~1 session)

| Route | API |
|-------|-----|
| `/staff` | `GET /users`, `POST /users`, `PATCH /users/:id`, deactivate, reset-password |
| (dropdown) | `GET /roles` |

### Steps

1. Staff table with search + pagination.
2. Create staff dialog — name, phone, role → show `tempPassword` once in alert dialog.
3. Deactivate + reset password actions with confirmation.

### Done when

- [ ] Super Admin creates Admissions Clerk test account
- [ ] Temp password shown once; new user can log in on FE-1 flow

---

## Phase FE-7 — Lookups admin (~½ session)

| Route | API |
|-------|-----|
| `/lookups` | GET/POST/PATCH admission-categories + document-types |

### Steps

1. Two tabs: Admission Categories · Document Types.
2. Add row dialog; deactivate via `isActive: false` (PATCH).

### Done when

- [ ] New category appears in student form dropdown after refresh

---

## Phase FE-8 — Bulk CSV import (~1 session)

| Route | API |
|-------|-----|
| `/import` | `POST /migration/parse`, `POST /migration/commit` |

### Steps

1. **Step 1 — Upload** — `multipart/form-data` field `file` (.csv / .xlsx).
2. **Step 2 — Preview** — table of valid rows + error table (`row`, `error`).
3. **Step 3 — Confirm** — send `{ students: preview }` to commit; show inserted count.
4. Sample file link to `backend/scripts/fixtures/sample-students.csv`.

### Done when

- [ ] Import 2-row sample CSV successfully
- [ ] Row with bad blood group shows in `errorRows`, not committed

---

## Phase FE-9 — Dashboard + audit logs (~1 session)

| Route | API |
|-------|-----|
| `/` | `GET /dashboard/summary`, `GET /dashboard/compliance-report` |
| `/audit-logs` | `GET /audit-logs?page&limit&search` |

### Steps

1. **Dashboard** — KPI cards (total, active, alumni, docs complete, docs pending).
2. **Compliance table** — students with `missingDocumentTypes[]`; link to student detail.
3. **Audit logs** — paginated table, search by entity/action.

### Done when

- [ ] Super Admin sees live counts after import
- [ ] Compliance report links to student document tab

---

## Phase FE-10 — Polish & role testing (~1 session)

### Steps

1. **Loading / error states** — skeletons, empty states, toast errors from API.
2. **Mobile sidebar** — collapsible nav for tablet use.
3. **Role matrix test** — manual checklist with 4 test accounts:

| Role | Can access | Cannot access |
|------|------------|---------------|
| Super Admin | Everything | — |
| Admissions Clerk | Students, docs upload/verify, import | Dashboard, staff, audit |
| Finance | Students (sensitive), income/BPL docs | Create students, staff |
| Teacher/Warden | Student list (basic only) | Family, documents, admin |

4. **Build for production** — `npm run build`, env vars for deployed API URL.

### Done when

- [ ] All four roles verified in browser
- [ ] Production build succeeds

---

## Suggested timeline

| Week | Phases |
|------|--------|
| 1 | FE-0, FE-1, FE-2 |
| 2 | FE-3, FE-4 |
| 3 | FE-5, FE-6 |
| 4 | FE-7, FE-8, FE-9, FE-10 |

Adjust pace as needed — each phase is independently testable.

---

## Phase FE+ — Nice features (after Phase 1 UI works)

*Defer until core flows are stable. Backend may need small additions later.*

| Feature | Value | Notes |
|---------|-------|-------|
| **Kannada UI labels** | Accessibility for local staff | i18n (`react-i18next`); keep API in English |
| **Dark mode** | Comfort for long data-entry sessions | shadcn theme toggle |
| **Student photo crop** | Better avatar uploads | `react-easy-crop` before R2 PUT |
| **Document expiry alerts** | Compliance | Dashboard badge when `expiryDate` near |
| **Print / PDF export** | Reports for trustees | Student profile PDF, compliance report |
| **Offline-friendly forms** | Unreliable network | Draft to `localStorage`, retry submit |
| **Global search (Cmd+K)** | Power users | Jump to student by admission # |
| **Activity feed on dashboard** | Ops visibility | Recent audit logs widget |
| **Medical records module** | Phase 2+ | New tab on student; needs backend schema |
| **WhatsApp notify hooks** | Phase 2+ | Placeholder UI only until notification service |

---

## When you return to backend (post-frontend)

Likely small FE-driven API tweaks:

- Aggregate `GET /documents?status=Pending` for global queue (optional).
- `PATCH /users/me` to clear `must_reset_password` after reset (if not handled by Supabase alone).
- Medical records module (Phase 2).
- Pagination filters on compliance report (if student count grows).

---

## Quick reference — all API endpoints the FE will call

```
GET  /health
GET  /users/me
GET  /users, POST /users, GET/PATCH /users/:id
PATCH /users/:id/deactivate, POST /users/:id/reset-password
GET  /roles
GET  /lookups/blood-groups, /admission-categories, /document-types
POST/PATCH lookups (admin)
GET/POST/PATCH /students, GET /students/:id, PATCH deactivate
POST /students/:id/avatar/presign|confirm
GET  /students/:id/documents, POST presign|confirm
GET  /documents/:id/download, PATCH /documents/:id/verify
POST /migration/parse, POST /migration/commit
GET  /dashboard/summary, /dashboard/compliance-report
GET  /audit-logs
```

Auth: Supabase client only (`signInWithPassword`, `updateUser`, `signOut`, `refreshSession`).

---

## Start command (when ready to build)

```bash
cd frontend
cp .env.example .env   # fill Supabase anon key + API URL
# FE-0 scaffold commands above
```

Say **"start FE-0"** when you want implementation to begin.
