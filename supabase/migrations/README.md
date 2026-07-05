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

Apply migrations through `010` in the Supabase SQL Editor (or `supabase db push` if using the CLI) before testing Phase 2 APIs.

After migrations, insert the Phase 1 tenant (Section 5.4):

```sql
INSERT INTO tenants (name, subdomain)
VALUES ('Shivayogi Jnana Mandir', 'shivayogi-jnana-mandir')
RETURNING id;
```

Then run `backend/scripts/bootstrap-first-admin.ts` (once backend scaffold exists).

Full spec: [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)
