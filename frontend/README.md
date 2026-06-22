# Shivayogi Jnana Mandir — Frontend

React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui.

## Setup

```bash
cp .env.example .env   # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |

## Structure

```
src/
  components/   # shadcn UI + shared layout
  features/     # auth, students, documents, …
  hooks/
  lib/          # env, utils, supabase, api (later)
  routes/
  types/
```

See [FRONTEND_PLAN.md](../FRONTEND_PLAN.md) for phased build order (FE-0 through FE-10).

## FE-0 status

- Vite React-TS scaffold
- Tailwind v4 + shadcn theme (zinc)
- Path alias `@/*` → `src/*`
- Core deps installed (router, react-query, supabase, zod, react-hook-form)
- shadcn `Button` component

## FE-1 status

- Supabase phone + password login (`/login`)
- Session via `AuthProvider` + `useAuth`
- `GET /users/me` via `useMe` (TanStack Query)
- Forced password reset (`/reset-password`) → `POST /users/me/password-changed`
- Protected routes + sign out
