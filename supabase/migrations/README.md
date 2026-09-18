# Supabase Migrations

Apply in order via the Supabase SQL Editor or Supabase CLI:

1. `001_schema.sql` — tables (Section 4)
2. `002_seeds_and_trigger.sql` — global permissions, blood groups, tenant trigger (Section 10)
3. `003_bulk_insert_rpc.sql` — CSV bulk import RPC (Section 8.3)
4. `004_academic_and_identity.sql` — academic lookups, enrollments, emergency contacts, identity fields
5. `005_bulk_insert_extended.sql` — extended bulk RPC for new student fields
6. `006_fix_deactivated_students_visibility.sql` — restore Alumni/Discontinued students to list queries
7. `007_sats_social_admission_seq.sql` — SATS ID, social/caste details, SJM admission sequence, lookup i18n labels
8. `008_remarks_hostel_medical.sql` — student remarks, hostel blocks/rooms/allocations, hostel attendance, basic medical records, PDF export permission
9. `009_health_visits.sql` — infirmary health visits, visit medicines, health lookups, student `health_status`
10. `010_health_phase2.sql` — medicine catalog, visit photo attachments, catalog seed
11. `011_karnataka_social_categories.sql` — Karnataka social category codes (sc, st, cat_*)
12. `012_bulk_import_social.sql` — optional blood/admission category; SATS + social details in bulk import
13. `013_medical_staff_role.sql` — Medical Staff role (infirmary-only: medical + student read)
14. `014_hostel_beds.sql` — `hostel_beds` table, `room_allocations.bed_id`, backfill beds from room capacity
15. `015_hostel_session_period.sql` — morning/evening `session_period`; deduplicates existing same-day sessions before unique index (safe to re-run if index step failed)
16. `016_health_attachment_kinds.sql` — health visit attachment kind lookup, eye test medical record type
17. `017_enrollment_type.sql` — adds `student_enrollments.enrollment_type` (`NEW` / `PROMOTED` / `TRANSFERRED` / `REPEATED`), backfills existing rows to `NEW`, deduplicates and enforces one enrollment per student per academic year (`idx_student_enrollments_student_year`).
18. `018_promote_students.sql` — adds `students:promote` permission (granted to Super Admin, backfilled onto existing tenants) and the `promote_students()` RPC: atomically advances every active, currently-enrolled student in a source standard to a target academic year/standard, with per-student holdback (→ `REPEATED`, stays in the source standard) and exclude lists, skips departed students and already-promoted students, and supports a `dryRun` preview.

Apply migrations through `018` in the Supabase SQL Editor (or `supabase db push` if using the CLI) before testing Phase 2 APIs.

**Note on `015`:** If a previous run failed on `idx_hostel_attendance_session_unique`, the `session_period` column may already exist. Re-run the full `015` script — it is idempotent and will merge duplicate same-day sessions (keep oldest two as morning/evening, soft-delete extras, re-point attendance records) before creating the index.

After migrations, insert the Phase 1 tenant (Section 5.4):

```sql
INSERT INTO tenants (name, subdomain)
VALUES ('Shivayogi Jnana Mandir', 'shivayogi-jnana-mandir')
RETURNING id;
```

Then run `backend/scripts/bootstrap-first-admin.ts` (once backend scaffold exists).

Full spec: [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)
