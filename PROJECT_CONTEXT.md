# 📄 PROJECT_CONTEXT.md (Engineering Specification)

**Project:** Divine Charitable Trust ERP System
**Phase 1 Tenant:** Shivayogi Jnana Mandir (operated by Divine Charitable Trust)
**Phase:** 1 (Core Foundation & Multi-Tenant Setup)
**Version:** 1.4

## Changelog

| Version | Key Changes |
|---|---|
| 1.0 | Initial schema, RBAC matrix, tech stack |
| 1.1 | Normalized RBAC, master lookups, audit logs, soft deletes |
| 1.2 | Supabase auth flow, RLS policy, R2 rules, CSV workflow |
| 1.3 | Fixed invalid RLS/RPC assumptions, field-level RBAC, document type lookup, error handling, rate limiting, backup policy, master data seeding, dashboard endpoints |
| 1.4 | Staff onboarding workflow, tenant/first-admin bootstrap, pagination standard, BaseRepository (structural audit logging), profile photo, status reason tracking, Phase 2+ roadmap (hostel + notifications), env var checklist |

---

## 1. Project Vision & Architecture Context

This software is an Enterprise Resource Planning (ERP) system initially built for the **Divine Charitable Trust**, which operates a free residential school — **Shivayogi Jnana Mandir** — providing education, food, and accommodation to male students from underprivileged backgrounds, single-parent homes, or families experiencing severe financial and social distress.

**Architectural Mandate:** This system is architected from Day 1 as a **Multi-Tenant SaaS**. Even though Phase 1 serves only one trust, the codebase and database must strictly isolate data using `tenant_id`. This allows the platform to be commercialized for other schools later — without a rewrite — to help fund the trust's charitable work.

### 1.1 Phase 1 Scope

**In Scope:**
1. Multi-tenant system initialization (`tenant_id` isolation).
2. Role-Based Access Control (Super Admin, Admissions Clerk, Finance, Teacher/Warden).
3. Staff account lifecycle: bootstrap, creation, deactivation, password reset.
4. Comprehensive student database (demographics, family background, emergency contacts).
5. Digital document vault (Aadhaar, income certificates, BPL cards, etc.).
6. Bulk CSV/Excel migration tool for existing student records.
7. Super Admin monitoring dashboard (headcount, document compliance, capacity).

**Out of Scope for Phase 1 (see Section 14 for the full roadmap):**
- Daily attendance logging UI for teachers.
- Gradebooks and academic report cards.
- **Hostel management** — room allocation, bed capacity, gate passes, warden headcounts.
- Medical incident tracking and daily medicine logs.
- **Notification service** — WhatsApp (Wati.io/Interakt) or email.
- Payments (Razorpay/UPI) — relevant only once commercial tenants are onboarded.

> **Cursor AI instruction:** Do not generate routes, tables, or UI for out-of-scope items, even if they seem like natural extensions of in-scope tables. Section 14 documents *why* certain schema/format decisions in Phase 1 are made with these future phases in mind — that section is for awareness only and should not be implemented now.

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
11. **Phone Number Format:** All phone numbers (`user_profiles.phone_number`, `student_family_details.primary_contact`) are stored in **E.164 format** (`+91XXXXXXXXXX`), validated via Zod regex at the API boundary. This is required for future WhatsApp notification integration — see Section 14.

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

Phase 1 has exactly one tenant. There is no public "create your school" signup flow, and none should be built — that's a Phase 3+ commercial-launch concern requiring billing and onboarding infrastructure. The tenant and its first Super Admin are created **once, manually**, via a script that is never exposed as an API route.

```sql
-- Run once in the Supabase SQL editor
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

  const { data: role } = await supabase
    .from('roles')
    .insert({ tenant_id: TENANT_ID, name: 'Super Admin' })
    .select()
    .single();

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

1. **Upload** — accept `.csv` or `.xlsx`.
2. **Validate** — Zod schema checks mandatory fields, formats, and normalizes phone numbers per row.
3. **Check duplicates** — query existing `admission_number`s for this tenant.
4. **Preview** — return `{ validRows: 140, errorRows: [{ row: 3, error: "Missing DOB" }] }`.
5. **Commit** — only after the admin confirms, call the RPC function below.

### 8.3 Atomic Insert via Postgres RPC

```sql
CREATE OR REPLACE FUNCTION bulk_insert_students(
  p_tenant_id INT,
  p_created_by UUID,
  p_students JSONB
) RETURNS JSONB AS $$
DECLARE
  v_student JSONB;
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

## 10. Master Data Seeding

```sql
-- Global lookups (run once)
INSERT INTO lookup_blood_groups (value) VALUES
  ('O+'), ('O-'), ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-')
ON CONFLICT (value) DO NOTHING;

-- Tenant-scoped lookups, auto-seeded on tenant creation
CREATE OR REPLACE FUNCTION seed_default_tenant_lookups()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lookup_admission_categories (tenant_id, value) VALUES
    (NEW.id, 'Orphan'), (NEW.id, 'Single Parent'), (NEW.id, 'BPL'), (NEW.id, 'Destitute')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_document_types (tenant_id, value) VALUES
    (NEW.id, 'Aadhaar Card'), (NEW.id, 'Income Certificate'), (NEW.id, 'BPL Card'),
    (NEW.id, 'Birth Certificate'), (NEW.id, 'Caste Certificate'), (NEW.id, 'School Leaving Certificate')
  ON CONFLICT (tenant_id, value) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_tenant_lookups
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION seed_default_tenant_lookups();
```

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
/src
  /config          # Supabase client init, R2 credentials, env loading
  /repositories     # BaseRepository (shared tenant/soft-delete/pagination/audit logic)
  /middlewares     # extractTenant, requirePermission, validateZod, rateLimiters, globalErrorHandler
  /modules
    /auth          # Token verification, staff creation, deactivation, password reset
    /students      # Routes, Controllers, Services, Repositories
    /documents     # Presigned URL generation, upload confirmation, verification
    /system        # Lookups, CSV migration, dashboard endpoints, audit log service
  /utils           # AppError, logger
/scripts
  bootstrap-first-admin.ts  # one-time manual script, never an API route
```
