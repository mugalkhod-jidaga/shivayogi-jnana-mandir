# Supabase Migrations

Apply in order via the Supabase SQL Editor or Supabase CLI:

1. `001_schema.sql` — tables (Section 4)
2. `002_seeds_and_trigger.sql` — global permissions, blood groups, tenant trigger (Section 10)
3. `003_bulk_insert_rpc.sql` — CSV bulk import RPC (Section 8.3)
4. `004_academic_and_identity.sql` — academic lookups, enrollments, emergency contacts, identity fields
5. `005_bulk_insert_extended.sql` — extended bulk RPC for new student fields

After migrations, insert the Phase 1 tenant (Section 5.4):

```sql
INSERT INTO tenants (name, subdomain)
VALUES ('Shivayogi Jnana Mandir', 'shivayogi-jnana-mandir')
RETURNING id;
```

Then run `backend/scripts/bootstrap-first-admin.ts` (once backend scaffold exists).

Full spec: [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)
