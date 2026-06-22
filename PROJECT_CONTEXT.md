# 📄 PROJECT_CONTEXT.md (Engineering Specification)

**Project:** Divine Charitable Trust ERP System
**Phase 1 Tenant:** Shivayogi Jnana Mandir (operated by Divine Charitable Trust)
**Phase:** 1 (Core Foundation & Multi-Tenant Setup)
**Version:** 1.6

## Changelog

| Version | Key Changes |
|---|---|
| 1.0 | Initial schema, RBAC matrix, tech stack |
| 1.1 | Normalized RBAC, master lookups, audit logs, soft deletes |
| 1.2 | Supabase auth flow, RLS policy, R2 rules, CSV workflow |
| 1.3 | Fixed invalid RLS/RPC assumptions, field-level RBAC, document type lookup, error handling, rate limiting, backup policy, master data seeding, dashboard endpoints |
| 1.4 | Staff onboarding workflow, tenant/first-admin bootstrap, pagination standard, BaseRepository (structural audit logging), profile photo, status reason tracking, Phase 2+ roadmap (hostel + notifications), env var checklist |
| 1.5 | Auto-seeded roles/permissions via DB trigger, pipeline CSV lookup mapping, centralized E.164 Zod validator, split FE/BE environment variables |
| 1.6 | **(Current)** Merged v1.5 gaps from planning draft; complete API catalog; frontend screen plan; Finance document scoping; extended bulk RPC for family details; Supabase setup checklist; implementation build order |

> **Planning status:** Spec is ready for review before implementation. Supabase project already exists — apply migrations per Section 5.7.

---

## 1. Project Vision & Architecture Context

This software is an Enterprise Resource Planning (ERP) system initially built for the **Divine Charitable Trust**, which operates a free residential school — **Shivayogi Jnana Mandir** — providing education, food, and accommodation to male students from underprivileged backgrounds.

**Architectural Mandate:** This system is architected from Day 1 as a **Multi-Tenant SaaS**. Even though Phase 1 serves only one trust, the codebase and database must strictly isolate data using `tenant_id`.

### 1.1 Phase 1 Scope

**In Scope:**
1. Multi-tenant system initialization (`tenant_id` isolation).
2. Role-Based Access Control (Super Admin, Admissions Clerk, Finance, Teacher/Warden) auto-seeded per tenant.
3. Staff account lifecycle: bootstrap, creation, deactivation, password reset.
4. Comprehensive student database (demographics, family background, emergency contacts).
5. Digital document vault (Aadhaar, income certificates, BPL cards, etc.).
6. Bulk CSV/Excel migration tool with pipeline validation and lookup mapping.
7. Super Admin monitoring dashboard (headcount, document compliance, capacity).

**Out of Scope for Phase 1 (see Section 14 for the full roadmap):**
- Daily attendance logging UI for teachers.
- Gradebooks and academic report cards.
- **Hostel management** — room allocation, bed capacity, gate passes, warden headcounts.
- Medical incident tracking and daily medicine logs.
- **Notification service** — WhatsApp (Wati.io/Interakt) or email.
- Payments (Razorpay/UPI) — relevant only once commercial tenants are onboarded.

> **Cursor AI instruction:** Do not generate routes, tables, or UI for out-of-scope items. Section 14 documents *why* certain schema decisions in Phase 1 are made — that section is for awareness only and should not be implemented now.

### 1.2 Infrastructure Status (Phase 1)

| Item | Status | Notes |
|---|---|---|
| Supabase project | **Created** | Apply schema + seeds from Section 10 via `supabase/migrations/` (Section 15) |
| Cloudflare R2 bucket | Pending | Private bucket required before document module |
| Backend codebase | Not started | Scaffold per `backend/prompt.md` |
| Frontend codebase | Not started | Scaffold per Section 17 |
| First tenant + Super Admin | Pending | Run bootstrap after migrations (Section 5.4) |

---

## 2. Technology Stack & Constraints

* **Database & Auth:** Supabase (PostgreSQL with built-in `auth.users`).
* **Backend:** Node.js, Express.js, TypeScript.
* **Frontend:** React.js (Vite), Tailwind CSS, shadcn/ui.
* **Validation:** Zod (strict API payload validation).
* **Storage:** Cloudflare R2 (S3-compatible, zero egress fees).
* **Rate Limiting:** `express-rate-limit`.
* **Security headers:** `helmet` middleware on the Express app.

**Non-Functional Requirements:**
* API Response Time: < 250ms (excluding file uploads).
* Max File Upload Size: 25MB per document.
* Data Retention: Student records kept indefinitely; audit logs retained 2 years minimum.
* Recovery Time Objective (RTO): 4 hours. Recovery Point Objective (RPO): 24 hours.
* CORS: restrict `Access-Control-Allow-Origin` to the deployed frontend domain (and `localhost` in development) — never `*`.
* Expose `GET /api/v1/health` returning `{ status: 'ok' }` for uptime monitoring on Render/Railway.

---

## 3. Engineering & Cursor AI Rules

When generating code for this project, the AI MUST adhere to the following standards:

1. **Architecture:** Strictly follow the Controller → Service → Repository pattern. Controllers stay thin; business logic lives in services; all SQL/Supabase calls live in repositories.
2. **API Standards:** RESTful routes under `/api/v1/...`. Standardize JSON responses: `{ success: boolean, data?: any, error?: string }`.
3. **Validation:** Every POST/PATCH request MUST pass through a Zod schema before reaching controller logic.
4. **Auth Table Isolation:** `auth.users` is managed entirely by Supabase. Never write custom SQL against `auth.users`. Validate JWTs in middleware and sync profile data to `user_profiles`.
5. **Multi-Tenancy Enforcement is Application-Level, Not RLS:** The Express backend connects to Supabase using the **service role key**, which bypasses Postgres Row Level Security. Every Repository method MUST explicitly filter by `tenant_id` — see Section 6.
6. **Soft Deletes:** Never use `DELETE`. Always `UPDATE ... SET deleted_at = NOW()`. Every `SELECT` must append `WHERE deleted_at IS NULL`.
7. **No Hardcoding:** Dropdown values (blood group, admission category, document type) must always come from a `lookup_*` table — never hardcoded string literals.
8. **Error Handling:** All thrown errors must use the `AppError` class (Section 9) so the global error handler can format a consistent response.
9. **Pagination & Searching:** Any `GET` route returning a list (Students, Audit Logs, Users) MUST implement offset/limit pagination. Query params: `?page=1&limit=20&search=keyword`. Response metadata: `{ success: true, data: [...], meta: { total, page, limit } }`. `limit` is capped at 100 server-side regardless of what's requested.
10. **Structural Audit Logging:** Audit logging for updates and soft-deletes on core entities (Students, Documents, Users) is NOT something to remember to call manually — it is inherited automatically by extending `BaseRepository` (Section 6.2). Do not write one-off update/delete logic in a repository that bypasses it.
11. **Phone Number Format:** All phone numbers (`user_profiles.phone_number`, `student_family_details.primary_contact`) are stored in **E.164 format** (`+91XXXXXXXXXX`), validated via `/src/utils/validators.ts` (`phoneSchema`, `normalizeIndianPhone` for CSV). Required for future WhatsApp notification integration — see Section 14.

---

## 4. Database Schema (PostgreSQL)

```sql
-- ==========================================
-- 1. SYSTEM & MULTI-TENANCY
-- ==========================================
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ==========================================
-- 2. AUTHENTICATION & NORMALIZED RBAC
-- ==========================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20) NOT NULL, -- E.164 format, e.g. +919876543210
    email VARCHAR(255) NULL,            -- nullable now; reserved for Phase 2 email notifications
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive'
    must_reset_password BOOLEAN DEFAULT TRUE, -- forces password change after admin-created accounts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, phone_number)
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL, -- 'Super Admin', 'Admissions Clerk', 'Finance', 'Warden'
    UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'students:read'
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- 3. MASTER DATA (LOOKUPS)
-- ==========================================
CREATE TABLE lookup_blood_groups (
    id SERIAL PRIMARY KEY,
    value VARCHAR(5) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE lookup_admission_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL, -- 'Orphan', 'BPL', etc.
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE lookup_document_types (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL, -- 'Aadhaar Card', 'Income Certificate', etc.
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

-- ==========================================
-- 4. CORE STUDENT ENTITIES
-- ==========================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    admission_number VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    dob DATE NOT NULL,
    gender VARCHAR(20) DEFAULT 'Male',
    photo_url TEXT NULL,                -- profile photo; distinct from verified documents below
    blood_group_id INT REFERENCES lookup_blood_groups(id),
    admission_category_id INT REFERENCES lookup_admission_categories(id),
    medical_alerts TEXT,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Alumni', 'Discontinued'
    status_reason TEXT NULL,             -- why the status changed (board/audit visibility)
    status_changed_at TIMESTAMP NULL,
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, admission_number)
);

CREATE TABLE student_family_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_name VARCHAR(100),
    parent_status VARCHAR(50) NOT NULL, -- 'Both Alive', 'Single Mother', 'Orphan'
    annual_income NUMERIC,
    primary_contact VARCHAR(20) NOT NULL, -- E.164 format, e.g. +919876543210
    house_details VARCHAR(255),
    village_town VARCHAR(150) NOT NULL,
    taluk_mandal VARCHAR(150) NOT NULL,
    district VARCHAR(150) NOT NULL,
    state VARCHAR(150) DEFAULT 'Karnataka',
    pincode VARCHAR(10) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type_id INT REFERENCES lookup_document_types(id) NOT NULL,
    file_url TEXT NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INT,
    status VARCHAR(50) DEFAULT 'Pending Review', -- 'Verified', 'Rejected', 'Renewal Needed'
    expiry_date DATE NULL,
    uploaded_by UUID REFERENCES user_profiles(id),
    verified_by UUID REFERENCES user_profiles(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ==========================================
-- 5. AUDIT LOGGING
-- ==========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id),
    user_id UUID REFERENCES user_profiles(id),
    entity_type VARCHAR(100),
    entity_id UUID,
    action_type VARCHAR(50), -- 'view', 'download', 'update', 'soft_delete', 'login'
    metadata JSONB NULL,     -- { "before": {...}, "after": {...} } for updates
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
*(Schema identical to Version 1.4 for `tenants`, `user_profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `master_lookups`, `students`, `student_family_details`, `student_documents`, and `audit_logs`)*

---

## 5. Authentication, Staff Lifecycle & JWT Lifecycle

The Express backend never handles raw passwords. General flow: client authenticates via the Supabase client SDK → receives an access token (1 hour) and refresh token (7 days) → sends the access token as `Authorization: Bearer <token>` on every API call.

### 5.1 Supabase Client Initialization

```typescript
// /src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Backend ALWAYS uses the service role key. Never expose this to the frontend.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 5.2 Tenant Extraction Middleware

```typescript
// /src/middlewares/extractTenant.ts
import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';

export async function extractTenantMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError(401, 'Missing token'));

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, error: 'TOKEN_EXPIRED_OR_INVALID' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('tenant_id, id, status')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single();

  if (profileError || !profile || profile.status !== 'Active') {
    return next(new AppError(403, 'User profile not found or inactive'));
  }

  req.user = user;
  req.tenantId = profile.tenant_id;
  next();
}
```

### 5.3 JWT Refresh on the Frontend

```typescript
// On 401 with error === 'TOKEN_EXPIRED_OR_INVALID'
const { data, error } = await supabase.auth.refreshSession();
if (error) redirectToLogin(); // refresh token also expired (>7 days)
```

### 5.4 Tenant & First Super Admin Bootstrap (Phase 1: Manual Seed, Not an API)

Phase 1 has exactly one tenant. The tenant and its first Super Admin are created **once, manually**, via a script. Because the database trigger (Section 10) auto-creates all roles and permissions when the tenant is inserted, this script simply links the auth user to the newly created `Super Admin` role.

```sql
-- 1. Run once in the Supabase SQL editor to trigger role & lookup creation
INSERT INTO tenants (name, subdomain)
VALUES ('Shivayogi Jnana Mandir', 'shivayogi-jnana-mandir')
RETURNING id; -- note this id for the script below
```

```typescript
// /scripts/bootstrap-first-admin.ts — run manually with `ts-node`, NOT an API route
import { supabase } from '../src/config/supabase';

async function bootstrap() {
  const TENANT_ID = 1; // from the INSERT above

  const { data: authUser, error } = await supabase.auth.admin.createUser({
    phone: '+91XXXXXXXXXX', // designated admin's number, E.164 format
    password: 'TEMP_PASSWORD_SHARE_OUT_OF_BAND',
    phone_confirm: true,
  });
  if (error) throw error;

  // Role was auto-created by the DB trigger (Section 10) — fetch, do not insert
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('name', 'Super Admin')
    .single();
  if (roleError || !role) throw new Error('Super Admin role not found — run tenant INSERT first');

  await supabase.from('user_profiles').insert({
    id: authUser.user.id,
    tenant_id: TENANT_ID,
    first_name: 'Admin',
    last_name: 'User',
    phone_number: '+91XXXXXXXXXX',
    must_reset_password: true,
  });

  await supabase.from('user_roles').insert({ user_id: authUser.user.id, role_id: role.id });
  console.log('Bootstrap complete. Share the temp password with the admin out of band.');
}

bootstrap();
```

### 5.5 Staff Account Creation (Admin Only)

Public signup must be **disabled in the Supabase dashboard**. Only users holding `system:manage_roles` (Super Admins) can create staff accounts, via `POST /api/v1/users`.

```typescript
// /src/modules/auth/services/createStaffUser.ts
export async function createStaffUser(
  tenantId: number,
  { firstName, lastName, phone, roleId }: CreateStaffInput,
  createdBy: string
) {
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    phone, // already validated as E.164 by Zod before reaching here
    password: generateTempPassword(),
    phone_confirm: true, // skips SMS OTP verification since we're not using OTP login
  });
  if (authError) throw new AppError(400, authError.message);

  try {
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authUser.user.id,
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      must_reset_password: true,
    });
    if (profileError) throw profileError;

    await supabase.from('user_roles').insert({ user_id: authUser.user.id, role_id: roleId });
    return authUser.user;
  } catch (err) {
    // Compensating action: a Supabase Auth record can't share a transaction
    // with our own tables. If the profile/role insert fails, don't leave a
    // dangling Auth account with no profile (it would be permanently
    // rejected by extractTenantMiddleware with no way to retry cleanly).
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new AppError(500, 'Failed to create staff profile; auth account rolled back');
  }
}
```

> **Known Phase 1 limitation:** `auth.users` is global to the whole Supabase project, not scoped per tenant — so phone-number uniqueness is checked project-wide, not per school. This is fine with a single tenant. Before onboarding a second tenant, revisit this (e.g. a tenant-prefixed synthetic identifier for the Auth record, while `user_profiles.phone_number` stays the real, tenant-scoped login number).

The staff member logs in with the temp password and is forced to set a new one (`must_reset_password = true` is checked by the frontend immediately after login).

### 5.6 Account Deactivation & Password Reset

* **Deactivation:** `PATCH /api/v1/users/:id/deactivate` (Super Admin only) sets `user_profiles.status = 'Inactive'` and disables sign-in on the Supabase Auth record. `extractTenantMiddleware` already rejects inactive profiles (Section 5.2), but also disabling the Auth account itself prevents a still-valid refresh token from minting new access tokens. Confirm the exact `supabase-js` admin method/parameter for this against current Supabase docs, since admin API surface changes between SDK versions.
* **Password reset:** `POST /api/v1/users/:id/reset-password` (Super Admin only) issues a new temporary password via the Auth admin API and sets `must_reset_password = true` again.

### 5.7 Supabase Project Setup (Existing Project)

The Supabase project is already provisioned. Before writing application code, complete this checklist in the Supabase dashboard:

1. **Authentication → Providers:** Enable **Phone** sign-in. Disable **Email** public signup if shown.
2. **Authentication → Settings:** Disable **Enable sign ups** (staff accounts are admin-created only).
3. **Authentication → URL configuration:** Set Site URL to the deployed frontend domain; add `http://localhost:5173` for local dev.
4. **SQL Editor / Migrations:** Run migrations in order from `supabase/migrations/` (Section 15) — schema (Section 4), global seeds + trigger (Section 10), RPC (Section 8.3).
5. **API keys:** Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` → `backend/.env`. Copy `SUPABASE_URL` and **anon key** → `frontend/.env` as `VITE_SUPABASE_*`.
6. **Optional defense-in-depth:** Enable RLS on all app tables with **no policies** for `anon`/`authenticated` roles so accidental direct client queries are denied. The backend `service_role` bypasses RLS regardless.

---

## 6. Authorization: Tenant Isolation & RBAC

### 6.1 Why Tenant Isolation Lives in the Application Layer, Not RLS

A policy like `tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())` relies on `auth.uid()`, which is only populated when Postgres itself authenticates the connection as that user. Our backend connects with the **service_role** key, which Postgres treats as bypassing RLS by design — `auth.uid()` would be `NULL` for every backend request, so such a policy would silently do nothing.

**Enforcement for Phase 1 happens in code**, via the `BaseRepository` pattern below — not the database. *(Optional defense-in-depth: enable RLS with no policy for `anon`/`authenticated` roles, so a future accidental direct frontend connection is denied by default. The backend's `service_role` bypasses this regardless and is unaffected.)*

### 6.2 The BaseRepository Pattern

Tenant filtering, soft deletes, pagination, and audit logging are too important to rely on every developer remembering to add them by convention. They're built into a shared base class that every entity repository extends — this is the mechanism behind Rules #5, #6, #9, and #10 in Section 3.

```typescript
// /src/repositories/BaseRepository.ts
import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { auditLogService } from '../modules/system/services/auditLog.service';

interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchColumns?: string[]; // columns eligible for the `search` query param
}

export abstract class BaseRepository {
  constructor(protected tableName: string) {}

  async findAll(tenantId: number, options: ListOptions = {}) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100); // hard ceiling regardless of request
    const offset = (page - 1) * limit;

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (options.search && options.searchColumns?.length) {
      const orFilter = options.searchColumns
        .map((col) => `${col}.ilike.%${options.search}%`)
        .join(',');
      query = query.or(orFilter);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw new AppError(500, error.message);
    return { data, meta: { total: count, page, limit } };
  }

  async update(id: string, tenantId: number, changes: Record<string, any>, userId: string) {
    const { data: before } = await supabase
      .from(this.tableName).select('*').eq('id', id).eq('tenant_id', tenantId).single();

    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...changes, updated_at: new Date() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, this.tableName, id, 'update', { before, after: data });
    return data;
  }

  async softDelete(id: string, tenantId: number, userId: string) {
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, this.tableName, id, 'soft_delete');
  }
}
```

```typescript
// /src/modules/students/students.repository.ts
export class StudentsRepository extends BaseRepository {
  constructor() { super('students'); }

  list(tenantId: number, page: number, limit: number, search?: string) {
    return this.findAll(tenantId, {
      page, limit, search,
      searchColumns: ['first_name', 'last_name', 'admission_number'],
    });
  }
}
```

```typescript
// Pagination query params, shared across all list endpoints
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

// GET /api/v1/students
router.get('/', extractTenantMiddleware, requirePermission('students:read'), async (req, res) => {
  const { page, limit, search } = paginationSchema.parse(req.query);
  const { data, meta } = await studentsRepository.list(req.tenantId, page, limit, search);
  res.json({ success: true, data, meta });
});
```

Manual `auditLogService.record()` calls are reserved for actions that aren't a standard DB write — e.g. logging a document **download** (Section 7), which never touches `BaseRepository.update()`.

### 6.3 Permission List

```
students:read
students:create
students:edit
students:soft_delete
students:view_sensitive_data   -- gates annual_income, parent_status, guardian info
documents:upload
documents:view
documents:download
documents:verify                -- covers both verify and reject
audit_logs:view
system:manage_roles
system:manage_lookups
dashboard:view
```

### 6.4 Role → Permission Matrix

| Permission | Super Admin | Admissions Clerk | Finance | Teacher/Warden |
|---|---|---|---|---|
| students:read | ✓ | ✓ | ✓ | ✓ |
| students:create | ✓ | ✓ | ✗ | ✗ |
| students:edit | ✓ | ✓ | ✗ | ✗ |
| students:view_sensitive_data | ✓ | ✓ | ✓ | ✗ |
| documents:upload | ✓ | ✓ | ✗ | ✗ |
| documents:view | ✓ | ✓ | ✓ (income/BPL only) | ✗ |
| documents:verify | ✓ | ✓ | ✓ | ✗ |
| audit_logs:view | ✓ | ✗ | ✗ | ✗ |
| system:manage_roles / lookups | ✓ | ✗ | ✗ | ✗ |
| dashboard:view | ✓ | ✗ | ✗ | ✗ |

### 6.5 Field-Level Filtering in the Service Layer

```typescript
function serializeStudent(student, userPermissions: string[]) {
  const base = {
    id: student.id, admission_number: student.admission_number,
    first_name: student.first_name, last_name: student.last_name,
    dob: student.dob, gender: student.gender, photo_url: student.photo_url,
    blood_group: student.blood_group, medical_alerts: student.medical_alerts,
    status: student.status,
  };
  if (userPermissions.includes('students:view_sensitive_data')) {
    return { ...base, family_details: student.family_details };
  }
  return base;
}
```

### 6.6 Permission Middleware

```typescript
export function requirePermission(permission: string) {
  return async (req, res, next) => {
    const hasPermission = await checkUserPermission(req.user.id, permission);
    if (!hasPermission) return next(new AppError(403, 'Permission denied'));
    next();
  };
}
```

### 6.7 Finance Role — Document Type Scoping

The RBAC matrix grants Finance `documents:view` and `documents:download` for **Income Certificate** and **BPL Card** only. Enforce this in the **documents service layer**, not the controller:

```typescript
// /src/modules/documents/documents.service.ts
const FINANCE_ALLOWED_DOC_TYPES = ['Income Certificate', 'BPL Card'];

function filterDocumentsForRole(docs, userPermissions: string[], userRoles: string[]) {
  const isFinanceOnly =
    userRoles.includes('Finance') &&
    !userPermissions.includes('system:manage_roles');

  if (!isFinanceOnly) return docs;

  return docs.filter((d) => FINANCE_ALLOWED_DOC_TYPES.includes(d.document_type?.value));
}
```

Resolve allowed types by joining `lookup_document_types` — never hardcode IDs. The filter applies to list and single-document fetch paths. Super Admin and Admissions Clerk see all document types.

### 6.8 `student_documents` Tenant Isolation

`student_documents` has no `tenant_id` column. Every repository query MUST join through `students` and filter `.eq('students.tenant_id', tenantId)` plus `.is('student_documents.deleted_at', null)`.

---

## 7. Cloudflare R2 Integration & File Access

1. **Document storage path:** `/tenant_{tenant_id}/student_{student_id}/documents/{uuid}_{original_filename}`
2. **Profile photo path:** `/tenant_{tenant_id}/student_{student_id}/avatar/{uuid}_{original_filename}` — separate from documents since it has no verification workflow.
3. **Buckets stay private.** No public URLs are ever stored or returned.
4. **Uploads use presigned PUT URLs** (client uploads directly to R2). **Downloads use presigned GET URLs** (1 hour expiry), generated only after a permission check.
5. **Soft-deleted students:** their R2 files are left untouched for audit purposes.

```typescript
// /src/modules/documents/services/presignedUrl.service.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../../../utils/AppError';

const r2 = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
});

export async function getUploadUrl(tenantId: number, studentId: string, filename: string, kind: 'documents' | 'avatar') {
  const key = `tenant_${tenantId}/student_${studentId}/${kind}/${crypto.randomUUID()}_${filename}`;
  const command = new PutObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!, Key: key });
  const url = await getSignedUrl(r2, command, { expiresIn: 900 });
  return { uploadUrl: url, key };
}

export async function getDownloadUrl(documentId: string, tenantId: number, userId: string) {
  const doc = await documentsRepository.findById(documentId, tenantId);
  if (!doc) throw new AppError(404, 'Document not found');

  const command = new GetObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!, Key: doc.file_url });
  const url = await getSignedUrl(r2, command, { expiresIn: 3600 });

  await auditLogService.record(userId, tenantId, 'student_documents', documentId, 'download');
  return { downloadUrl: url };
}
```

---

## 8. Bulk Data Migration (CSV Upload)

### 8.1 Required CSV Headers

`admission_number, first_name, last_name, dob (YYYY-MM-DD), gender, blood_group, admission_category, father_name, mother_name, primary_contact, village_town, taluk_mandal, district, pincode`

> `primary_contact` must be normalized to E.164 (`+91XXXXXXXXXX`) during the validation step (8.2, step 2) before insertion — legacy registers often have inconsistent formats (`9876543210`, `09876543210`, `+91 98765 43210`). Strip non-digits, then prefix `+91` if a 10-digit number is detected.

### 8.2 Workflow

1. **Upload** — `POST /api/v1/migration/parse` accepts `.csv` or `.xlsx` (multipart).
2. **Validate & Map (Pipeline)** — Zod schema checks mandatory fields and normalizes phone numbers (Section 9). The service layer maps text strings (e.g. `"O+"`, `"BPL"`) to integer IDs by querying `lookup_*` tables for the current tenant.
   - *Error collection:* If a row fails Zod validation **or** lookup mapping fails (e.g. `"O Plus"` instead of `"O+"`), push to `errorRows`. Do **not** throw and abort the whole file.
3. **Check duplicates** — query existing `admission_number`s for this tenant; add conflicts to `errorRows`.
4. **Preview** — return `{ validRows: 140, errorRows: [{ row: 3, error: "Invalid Blood Group: O Plus" }], preview: [...] }`.
5. **Commit** — `POST /api/v1/migration/commit` only after admin confirms. Valid rows are passed to `bulk_insert_students` RPC (Section 8.3).

### 8.3 Atomic Insert via Postgres RPC

```sql
CREATE OR REPLACE FUNCTION bulk_insert_students(
  p_tenant_id INT,
  p_created_by UUID,
  p_students JSONB
) RETURNS JSONB AS $$
DECLARE
  v_student JSONB;
  v_student_id UUID;
  v_count INT := 0;
BEGIN
  FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    INSERT INTO students (
      tenant_id, admission_number, first_name, last_name, dob,
      gender, blood_group_id, admission_category_id, created_by, updated_by
    ) VALUES (
      p_tenant_id,
      v_student->>'admission_number', v_student->>'first_name', v_student->>'last_name',
      (v_student->>'dob')::DATE, COALESCE(v_student->>'gender', 'Male'),
      (v_student->>'blood_group_id')::INT, (v_student->>'admission_category_id')::INT,
      p_created_by, p_created_by
    ) RETURNING id INTO v_student_id;

    INSERT INTO student_family_details (
      student_id, father_name, mother_name, parent_status,
      primary_contact, village_town, taluk_mandal, district, pincode
    ) VALUES (
      v_student_id,
      v_student->>'father_name', v_student->>'mother_name',
      COALESCE(v_student->>'parent_status', 'Both Alive'),
      v_student->>'primary_contact',
      v_student->>'village_town', v_student->>'taluk_mandal',
      v_student->>'district', v_student->>'pincode'
    );

    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'inserted', v_count);
EXCEPTION WHEN OTHERS THEN
  -- The BEGIN...EXCEPTION block is an implicit savepoint: catching the
  -- exception here automatically discards every INSERT made earlier in
  -- this loop. Do not add an explicit ROLLBACK — functions (unlike
  -- procedures) can't execute transaction control commands.
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'inserted_before_failure', v_count);
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Error Handling & Validation Standards

### 9.1 Centralized Validators

Phone validation is centralized in `/src/utils/validators.ts` to prevent regex drift between staff creation, student forms, and CSV imports.

```typescript
// /src/utils/validators.ts
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number (e.g., +919876543210)');

/** Normalize legacy Indian phone formats for CSV import. */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  throw new Error(`Unrecognized phone format: ${raw}`);
}
```

Use `phoneSchema` in all POST/PATCH Zod bodies. Use `normalizeIndianPhone` in the CSV pipeline before `phoneSchema.parse`.

### 9.2 AppError & Middleware

```typescript
// /src/utils/AppError.ts
export class AppError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

// /src/middlewares/globalErrorHandler.ts
export function globalErrorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
}

// /src/middlewares/validateZod.ts
export function validateZod(schema: ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}
```

---

## 10. Master Data & RBAC Seeding (Database Triggers)

Global permissions and blood groups are seeded once. Every new tenant row auto-seeds lookups, four roles, and role→permission mappings via a single trigger — no application-level setup scripts required.

```sql
-- ==========================================
-- GLOBAL SEEDS (run once per Supabase project)
-- ==========================================
INSERT INTO permissions (action, description) VALUES
  ('students:read', 'View basic student profiles'),
  ('students:create', 'Create new student records'),
  ('students:edit', 'Edit basic student profiles'),
  ('students:soft_delete', 'Deactivate student records'),
  ('students:view_sensitive_data', 'View family income and guardian details'),
  ('documents:upload', 'Upload verification documents'),
  ('documents:view', 'View uploaded documents'),
  ('documents:download', 'Download documents'),
  ('documents:verify', 'Approve or reject documents'),
  ('audit_logs:view', 'View system audit trails'),
  ('system:manage_roles', 'Create and manage staff accounts'),
  ('system:manage_lookups', 'Manage dropdown lists'),
  ('dashboard:view', 'View KPI dashboard')
ON CONFLICT (action) DO NOTHING;

INSERT INTO lookup_blood_groups (value) VALUES
  ('O+'), ('O-'), ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-')
ON CONFLICT (value) DO NOTHING;

-- ==========================================
-- TENANT TRIGGER (lookups + roles + permissions)
-- ==========================================
CREATE OR REPLACE FUNCTION seed_default_tenant_data()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id INT; v_clerk_id INT; v_finance_id INT; v_warden_id INT;
BEGIN
  -- A. Tenant-scoped lookups
  INSERT INTO lookup_admission_categories (tenant_id, value) VALUES
    (NEW.id, 'Orphan'), (NEW.id, 'Single Parent'), (NEW.id, 'BPL'), (NEW.id, 'Destitute')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_document_types (tenant_id, value) VALUES
    (NEW.id, 'Aadhaar Card'), (NEW.id, 'Income Certificate'), (NEW.id, 'BPL Card'),
    (NEW.id, 'Birth Certificate'), (NEW.id, 'Caste Certificate'), (NEW.id, 'School Leaving Certificate')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  -- B. Roles
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Super Admin') RETURNING id INTO v_super_admin_id;
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Admissions Clerk') RETURNING id INTO v_clerk_id;
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Finance') RETURNING id INTO v_finance_id;
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Teacher/Warden') RETURNING id INTO v_warden_id;

  -- C. Role → permission mappings (Section 6.4)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_super_admin_id, id FROM permissions;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_clerk_id, id FROM permissions WHERE action IN
    ('students:read', 'students:create', 'students:edit', 'students:view_sensitive_data',
     'documents:upload', 'documents:view', 'documents:download', 'documents:verify');

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_finance_id, id FROM permissions WHERE action IN
    ('students:read', 'students:view_sensitive_data', 'documents:view', 'documents:download', 'documents:verify');

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_warden_id, id FROM permissions WHERE action IN ('students:read');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_tenant_data
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION seed_default_tenant_data();
```

> If the old `trg_seed_tenant_lookups` trigger exists from an earlier draft, drop it before applying this migration: `DROP TRIGGER IF EXISTS trg_seed_tenant_lookups ON tenants;`

---

## 11. Reporting & Dashboard Endpoints (Phase 1)

```
GET /api/v1/dashboard/summary
→ { totalStudents, activeStudents, alumniCount, documentsComplete, documentsPending }

GET /api/v1/dashboard/compliance-report
→ [{ studentId, admissionNumber, name, missingDocumentTypes: string[] }]
```

Both require `dashboard:view` (Super Admin only, Section 6.4).

---

## 12. Data Backup & Disaster Recovery

* Supabase performs automatic PostgreSQL backups (verify current retention window for your plan tier in project settings).
* Weekly manual export to a separate, encrypted R2 bucket as a secondary safeguard.
* RTO: 4 hours. RPO: 24 hours.
* R2-stored documents are not deleted when a student record is soft-deleted; they persist until a formal retention policy is decided (Phase 2+).

---

## 13. API Rate Limiting

```typescript
// /src/middlewares/rateLimiters.ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({ windowMs: 60_000, max: 5,
  message: { success: false, error: 'Too many login attempts, try again shortly.' } });

export const uploadLimiter = rateLimit({ windowMs: 60_000, max: 10,
  message: { success: false, error: 'Upload rate limit exceeded.' } });

export const defaultLimiter = rateLimit({ windowMs: 60_000, max: 60 });
```

---

## 14. Roadmap Beyond Phase 1 (Awareness Only — Not Built Now)

This section exists so Phase 1 naming and schema choices don't conflict with what's coming. Nothing here is implemented in the current phase, per the project's own "no overbuilding before validation" principle — confirm market fit with Phase 1 before any of this is built.

### Hostel Management (Phase 2+)
Anticipated tables: `hostel_blocks`, `hostel_rooms`, `room_allocations` (`student_id`, `room_id`, `allocated_from`, `allocated_to`), `gate_passes` (`student_id`, `out_time`, `in_time`, `approved_by`), `daily_headcounts`.
The `Warden` role already exists in RBAC under "Teacher/Warden" — when this module ships, it will likely split into its own dedicated permission set rather than sharing Teacher's. No schema work needed today.

### Notification Service (Phase 2+)
Planned channels: WhatsApp (Wati.io or Interakt) and email. Anticipated table: `notification_logs` (`recipient`, `channel`, `template`, `status`, `sent_at`) — not created now.
Two decisions already baked into the current schema for this:
- All phone numbers stored in E.164 format (Section 3, Rule #11) — required by WhatsApp Business API providers.
- `user_profiles.email` exists now (nullable, unused in Phase 1) so it isn't a migration later.

### Payments (Phase 3+)
Razorpay/UPI — relevant once commercial (fee-charging) tenants are onboarded. No schema impact on Phase 1.

---

## 15. Folder Structure

```text
/supabase
  /migrations
    001_schema.sql          # Section 4 tables
    002_seeds_and_trigger.sql # Section 10
    003_bulk_insert_rpc.sql   # Section 8.3

/backend
  /src
    /config          # Supabase client, R2 credentials, env loading
    /repositories    # BaseRepository (shared tenant/soft-delete/pagination/audit)
    /middlewares     # extractTenant, requirePermission, validateZod, rateLimiters, globalErrorHandler
    /modules
      /auth          # Staff creation, deactivation, password reset, /users/me
      /students      # Routes, Controllers, Services, Repositories
      /documents     # Presigned URLs, upload confirm, verification, download
      /system        # Lookups, CSV migration, dashboard, audit logs
    /utils           # AppError, validators.ts, logger
  /scripts
    bootstrap-first-admin.ts  # one-time manual script, never an API route

/frontend
  /src
    /components      # shadcn/ui primitives + shared layout
    /features        # auth, students, documents, staff, migration, dashboard
    /hooks           # useAuth, usePermissions, useApi
    /lib             # supabase client, api client (Bearer token + refresh)
    /routes          # React Router route definitions + guards
```

---

## 16. Complete API Catalog (Phase 1)

All routes except `GET /health` require `Authorization: Bearer <access_token>` and pass through `extractTenantMiddleware`. List endpoints use `paginationSchema` (Section 6.2).

### 16.1 System

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/health` | — | `{ status: 'ok' }` — no auth |
| GET | `/api/v1/users/me` | — (authenticated) | Current profile, roles, and permission list for FE guards |

### 16.2 Staff / Users

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/users` | `system:manage_roles` | Paginated staff list (`?page&limit&search`) |
| POST | `/api/v1/users` | `system:manage_roles` | Create staff (temp password, `must_reset_password`) |
| GET | `/api/v1/users/:id` | `system:manage_roles` | Staff detail |
| PATCH | `/api/v1/users/:id` | `system:manage_roles` | Update name / role |
| PATCH | `/api/v1/users/:id/deactivate` | `system:manage_roles` | Set Inactive + disable Auth sign-in |
| POST | `/api/v1/users/:id/reset-password` | `system:manage_roles` | Issue new temp password |
| GET | `/api/v1/roles` | `system:manage_roles` | Tenant roles (for staff creation dropdown) |

### 16.3 Lookups

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/lookups/blood-groups` | authenticated | Global blood groups (`is_active = true`) |
| GET | `/api/v1/lookups/admission-categories` | authenticated | Tenant admission categories |
| GET | `/api/v1/lookups/document-types` | authenticated | Tenant document types |
| POST | `/api/v1/lookups/admission-categories` | `system:manage_lookups` | Add category |
| PATCH | `/api/v1/lookups/admission-categories/:id` | `system:manage_lookups` | Update / deactivate |
| POST | `/api/v1/lookups/document-types` | `system:manage_lookups` | Add document type |
| PATCH | `/api/v1/lookups/document-types/:id` | `system:manage_lookups` | Update / deactivate |

### 16.4 Students

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/students` | `students:read` | Paginated list; field-level filter (Section 6.5) |
| POST | `/api/v1/students` | `students:create` | Create student + family details |
| GET | `/api/v1/students/:id` | `students:read` | Detail with optional sensitive fields |
| PATCH | `/api/v1/students/:id` | `students:edit` | Update demographics / family / status |
| PATCH | `/api/v1/students/:id/deactivate` | `students:soft_delete` | Soft delete; requires `status_reason` |
| POST | `/api/v1/students/:id/avatar/presign` | `students:edit` | Presigned PUT URL for profile photo |
| POST | `/api/v1/students/:id/avatar/confirm` | `students:edit` | Save `photo_url` after R2 upload |

### 16.5 Documents

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/students/:studentId/documents` | `documents:view` | List docs; Finance filter (Section 6.7) |
| POST | `/api/v1/students/:studentId/documents/presign` | `documents:upload` | Presigned PUT URL (`uploadLimiter`) |
| POST | `/api/v1/students/:studentId/documents/confirm` | `documents:upload` | Create `student_documents` row after upload |
| GET | `/api/v1/documents/:id/download` | `documents:download` | Presigned GET URL + audit `download` |
| PATCH | `/api/v1/documents/:id/verify` | `documents:verify` | Set `Verified` / `Rejected` / `Renewal Needed` |

### 16.6 Bulk Migration

| Method | Path | Permission | Description |
|---|---|---|---|
| POST | `/api/v1/migration/parse` | `students:create` | Upload CSV/XLSX → validate, map lookups, preview |
| POST | `/api/v1/migration/commit` | `students:create` | Commit previewed rows via RPC |

### 16.7 Audit & Dashboard

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | `audit_logs:view` | Paginated audit trail (`?page&limit&search`) |
| GET | `/api/v1/dashboard/summary` | `dashboard:view` | KPI counts |
| GET | `/api/v1/dashboard/compliance-report` | `dashboard:view` | Per-student missing document types |

### 16.8 Auth (Frontend Only — No Backend Routes)

Login, logout, password change, and session refresh use the **Supabase client SDK** directly on the frontend. The backend only validates JWTs via `extractTenantMiddleware`.

---

## 17. Frontend Plan (Phase 1)

### 17.1 Stack & Libraries

| Layer | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod (mirror backend schemas) |
| Auth | `@supabase/supabase-js` (phone + password) |

### 17.2 App Shell & Navigation

**Layout:** Sidebar + top bar with tenant name and signed-in user.

**Role-based nav** (hide items the user lacks permission for — fetch from `GET /users/me`):

| Nav item | Permission | Roles typically |
|---|---|---|
| Dashboard | `dashboard:view` | Super Admin |
| Students | `students:read` | All staff |
| Documents | `documents:view` | Super Admin, Admissions, Finance |
| Bulk Import | `students:create` | Super Admin, Admissions |
| Staff | `system:manage_roles` | Super Admin |
| Lookups | `system:manage_lookups` | Super Admin |
| Audit Logs | `audit_logs:view` | Super Admin |

### 17.3 Screen Map

| Route | Screen | Key behaviour |
|---|---|---|
| `/login` | Login | Phone + password via Supabase; public only route |
| `/reset-password` | Force password change | Shown when `must_reset_password === true` after login |
| `/` | Dashboard | KPI cards + compliance table link (Super Admin) |
| `/students` | Student list | Search, pagination, status badges, create button |
| `/students/new` | Add student | Multi-section form: demographics, family, lookups from API |
| `/students/:id` | Student detail | Tabs: Profile · Documents · History (status/audit) |
| `/students/:id/edit` | Edit student | Same form; status change requires reason |
| `/documents` | Document queue | Filter by status (Pending / Verified / Rejected); verify actions |
| `/import` | Bulk CSV wizard | 3 steps: Upload → Preview errors → Confirm commit |
| `/staff` | Staff list | Create / deactivate / reset password |
| `/lookups` | Lookup admin | Admission categories + document types CRUD |
| `/audit-logs` | Audit log viewer | Paginated, searchable |

### 17.4 Cross-Cutting Frontend Patterns

1. **API client** (`/frontend/src/lib/api.ts`): Attach `Authorization: Bearer`; on `401` + `TOKEN_EXPIRED_OR_INVALID`, call `supabase.auth.refreshSession()` once, then retry; on failure → `/login`.
2. **Permission guard:** `<RequirePermission permission="students:create">` wraps buttons and routes.
3. **Sensitive fields:** Family/income section hidden unless `students:view_sensitive_data` in `/users/me` response.
4. **File upload flow:** presign → `fetch(PUT)` to R2 URL → confirm endpoint (documents and avatar).
5. **Phone inputs:** Display-friendly UI; normalize to E.164 before submit using shared regex logic.

### 17.5 Frontend Build Order (mirrors backend)

1. Vite scaffold + shadcn + Tailwind + env wiring
2. Supabase auth (login, session, forced reset)
3. API client + `/users/me` + permission hooks
4. App shell + protected routes
5. Students module (list → detail → form)
6. Documents module (upload + verify queue)
7. Staff admin
8. Lookups admin
9. CSV import wizard
10. Dashboard + audit logs

---

## 18. Implementation Build Order & Review Checklist

Use this sequence for implementation and for the **pre-code review** of this spec.

```text
Phase A — Database (Supabase project exists)
  [ ] 001_schema.sql applied
  [ ] 002_seeds_and_trigger.sql applied
  [ ] 003_bulk_insert_rpc.sql applied
  [ ] INSERT tenant row → verify roles + lookups seeded
  [ ] bootstrap-first-admin.ts → first Super Admin can log in

Phase B — Backend foundation
  [ ] Express shell, helmet, CORS, rate limiters, health route
  [ ] extractTenantMiddleware + requirePermission + AppError
  [ ] BaseRepository + auditLogService
  [ ] GET /users/me

Phase C — Core modules (backend then frontend per module)
  [ ] Users / staff
  [ ] Lookups
  [ ] Students + family
  [ ] Documents + R2
  [ ] CSV migration
  [ ] Dashboard + audit logs

Phase D — Hardening
  [ ] Role permission matrix verified manually per role test account
  [ ] Finance document scoping verified
  [ ] CSV error-row preview tested with messy legacy data
```

**Review questions before coding:**

1. Is the API catalog complete for your operational workflows?
2. Are the four seeded roles sufficient for Phase 1 staff at the mandir?
3. Is the Finance document restriction (Income + BPL only) correct?
4. Which admission categories / document types need adding before go-live?
5. R2 bucket region and backup export process — who owns ops?

---