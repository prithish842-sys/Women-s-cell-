# Vercel Deployment

## Prerequisites

- Vercel project connected to this repository.
- Hosted PostgreSQL reachable from Vercel Functions.
- Vercel Blob store configured for uploads.
- Production secrets configured in Vercel environment variables.

## Required Environment Variables

### Server-Only

- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PUBLIC_ORIGIN`
- `CLIENT_URL`
- `STORAGE_DRIVER`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`
- `AI_PROVIDER_API_KEY`
- `GEMINI_API_KEY`
- `AI_MODEL`
- `ACADEMIC_YEAR_START_MONTH`
- `PROFILE_IMAGE_MAX_SIZE_MB`
- `GALLERY_IMAGE_MAX_SIZE_MB`
- `ACHIEVEMENT_IMAGE_MAX_SIZE_MB`
- `CERTIFICATE_MAX_SIZE_MB`
- `MAX_GALLERY_IMAGES_PER_UPLOAD`

### Safe For Frontend

- `VITE_API_BASE_URL`
- `VITE_UPLOAD_BASE_URL`

Values beginning with `VITE_` are bundled into browser JavaScript. Never put database URLs, JWT secrets, Blob write tokens, or AI provider keys in `VITE_*`.

## Database

Local development can keep using the Docker PostgreSQL service through `npm run db:up` and `npm run dev`.

Production must use a hosted PostgreSQL database. Configure `DATABASE_URL` in Vercel with the hosted database connection string. Use a connection string or pooler appropriate for serverless workloads.

Run production migrations deliberately during deployment:

```bash
npx prisma migrate deploy
```

Do not run reset, force-reset, destructive seed, or drop commands in production.

## Build

Vercel build command:

```bash
npm run build
```

Output directory:

```text
dist
```

The build script runs Prisma Client generation, TypeScript checking, Vite frontend build, and the existing local server bundle.

## Routing

`vercel.json` routes `/api/*` and `/uploads/*` to the Express function at `api/index.ts`.

All other paths fall back to `index.html`, so React Router routes such as `/student/dashboard`, `/faculty/workshops`, and `/admin/reports` survive direct browser refreshes.

Use this production frontend API base:

```text
VITE_API_BASE_URL=/api/v1
VITE_UPLOAD_BASE_URL=
```

## File Storage

Local development uses:

```text
STORAGE_DRIVER=local
```

Production uses:

```text
STORAGE_DRIVER=vercel_blob
```

Public uploads are stored as public Blob objects and saved as Blob URLs. Private uploads, including ICC attachments, anonymous concern attachments, and admin report documents, are stored as private Blob objects and served only through authenticated API routes.

Existing local `/uploads` records remain supported for local development. Before production launch, migrate any required existing local upload files to Blob storage or re-upload them through the application.

## CORS

Set `PUBLIC_ORIGIN` to the deployed Vercel site origin. `CLIENT_URL` may mirror the same value for compatibility with existing docs/scripts. Do not use `*` for private APIs.

Preview deployments are not broadly allow-listed. Add preview origins intentionally if you need them.

## Smoke Test Checklist

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- Public route refreshes: `/`, `/about`, `/members`, `/schemes`, `/skills`, `/safety`, `/gallery`, `/login`, `/register`
- Student route refreshes after login: `/student/dashboard`, `/student/profile`, `/student/workshops`, `/student/wellbeing`, `/student/schemes`
- Faculty route refreshes after login: `/faculty/dashboard`, `/faculty/students`, `/faculty/workshops`, `/faculty/profile`
- Admin route refreshes after login: `/admin/dashboard`, `/admin/students`, `/admin/members`, `/admin/workshops`, `/admin/schemes`, `/admin/reports`
- Upload a public image and confirm it renders.
- Upload an ICC/private report file and confirm unauthorized users cannot download it.

## Rollback

- Redeploy the previous Vercel deployment from the Vercel dashboard.
- Keep the database migration history intact; do not reset production data.
- If storage configuration is wrong, disable write actions temporarily and fix `STORAGE_DRIVER`/Blob variables before retrying uploads.

## Limitations

- Production file uploads require Vercel Blob configuration before launch.
- Existing files currently present only under local `uploads/` are not automatically copied to Blob.
- No background worker or WebSocket service was added; none is required by the current server scan.
