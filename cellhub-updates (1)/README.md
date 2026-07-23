# CellHub Updates

  Extract into your project root (same level as `artifacts/` and `lib/`).

  ## What Changed
  - artifacts/api-server/src/routes/auth.ts   — NEW: register/login/me endpoints
  - artifacts/api-server/src/routes/index.ts  — registers auth router
  - artifacts/api-server/package.json         — start script auto-loads ../../.env
  - lib/db/drizzle.config.ts                  — auto-loads ../../.env and .env
  - lib/db/package.json                       — clean push scripts
  - artifacts/mobile-store/src/**             — auth UI, account page, admin CRUD

  ## Setup (one-time)
  1. Place your .env in the project root with:
       DATABASE_URL=postgresql://...
       ADMIN_REGISTRATION_SECRET=cellhub-admin-2024
       JWT_SECRET=any-random-secret

  2. Install new dependencies:
       pnpm --filter @workspace/api-server add jsonwebtoken bcryptjs
       pnpm --filter @workspace/api-server add -D @types/jsonwebtoken @types/bcryptjs

  3. Push the users table to your database:
       pnpm --filter @workspace/db run push

  4. Start the server:
       pnpm --filter @workspace/api-server run dev
  