# Shivayogi Jnana Mandir — Divine Trust ERP (Phase 1)

Enterprise student information system for **Shivayogi Jnana Mandir**, operated by Divine Charitable Trust. Architected as multi-tenant SaaS from day one.

## Documentation

| Document | Purpose |
|---|---|
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | **Primary spec** — schema, API catalog, frontend plan, build order (v1.6) |
| [supabase/migrations/](./supabase/migrations/) | SQL migrations to apply to existing Supabase project |
| [backend/.env.example](./backend/.env.example) | Backend secrets template |
| [frontend/.env.example](./frontend/.env.example) | Frontend public env template |

## Status

- **Planning:** Complete — ready for spec review (Section 18 checklist)
- **Supabase project:** Created — run migrations next
- **Application code:** Not started

## Quick start (after review)

1. Apply `supabase/migrations/001` → `003` in your Supabase project
2. Insert tenant row (see migrations README)
3. Scaffold backend (`backend/prompt.md`) and frontend (Section 17)
4. Run `bootstrap-first-admin.ts`
