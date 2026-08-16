# Verification Baseline

This project keeps runtime behavior unchanged. Use these checks before and after each backend-connected feature.

## Commands

- `npm run verify` runs Prisma validation/generation/migration status, TypeScript, lint, tests, build, compatibility audit, and environment-name audit.
- `npm run dev` keeps the existing startup path: Docker PostgreSQL, `tsx watch server.ts`, and Vite on port 5173.
- `npm run verify:runtime` assumes `npm run dev` is already running and checks health, public APIs, unauthenticated protected-route rejection, static uploads, JSON envelopes, and sensitive-field exposure.

## Future Feature Checklist

1. Confirm existing route and component patterns.
2. Define the required database data.
3. Reuse an existing Prisma model when possible.
4. Add a schema change only when genuinely necessary.
5. Create a non-destructive migration.
6. Add backend validation.
7. Add backend authorization.
8. Add service/database logic.
9. Return a safe API response.
10. Add or reuse a frontend TypeScript type.
11. Add or reuse the existing Axios API client.
12. Add a TanStack Query hook or mutation.
13. Add correct query invalidation.
14. Connect the UI.
15. Add loading, empty, error, and success states.
16. Add frontend tests.
17. Add backend tests.
18. Add API contract checks.
19. Run `npm run verify`.
20. Run `npm run dev`.
21. Run `npm run verify:runtime`.
22. Check browser console and backend terminal.
23. Confirm Student, Faculty, Admin, and public regressions.
24. Inspect final diff before completion.

Do not complete database-backed features with frontend-only mock data or backend-only implementation.

## API Implementation Standard

Database / Prisma -> backend service -> backend controller -> backend route -> authentication and authorization -> existing validation -> safe response DTO -> existing Axios client -> TanStack Query hook -> React page/component -> loading, empty, error, and success states.

Do not call Prisma or the database from React, duplicate Axios clients, duplicate authentication headers, trust frontend user IDs, or store final persisted feature data only in `localStorage`.

## File Upload Standard

Reuse existing upload endpoints. Verify token attachment, Multer field names, MIME and size limits, safe filenames, relative database paths, static route resolution, frontend URL resolution, broken-image fallback, query invalidation, and safe deletion behavior.
