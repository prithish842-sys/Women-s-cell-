# Singa Pen - Women's Empowerment Cell Portal

Full-stack React, Express, PostgreSQL, and Prisma portal for the Singa Pen Women's Empowerment Cell initiative. It supports public pages, student/faculty/admin dashboards, student skills, faculty search, government schemes, site content, gallery albums, achievement records, ICC complaints, and file uploads.

## Stack

- React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Lucide, Motion
- Node.js, Express, TypeScript
- PostgreSQL on `localhost:5432`
- Prisma ORM and Prisma Client
- JWT authentication and bcrypt password hashing
- Multer uploads stored on local disk in development, Vercel Blob in production
- Vitest tests

## Local URLs

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Health:   http://localhost:5000/api/v1/health
Live:     http://localhost:5000/api/v1/health/live
Ready:    http://localhost:5000/api/v1/health/ready
API:      http://localhost:5000/api/v1
Public uploads: http://localhost:5000/uploads
Prisma Studio: http://localhost:5555
```

## PostgreSQL Setup

Copy the example file and fill in local values before running the app:

```powershell
Copy-Item .env.example .env
```

Docker option:

```powershell
docker compose up -d postgres
```

Local PostgreSQL option:

```powershell
psql -U postgres
CREATE DATABASE singa_pen_portal;
```

## First Run

```powershell
cd <project-folder>
npm install
Copy-Item .env.example .env
notepad .env
npx prisma generate
npm run prisma:migrate
npm run seed
npm run dev
```

WARNING:
The development seed process may replace existing development data.
Never run `npm run seed` against a production database.

Before `npm run seed`, set `ALLOW_DESTRUCTIVE_SEED=true`, `SEED_DEFAULT_PASSWORD`, and `WEC_MEMBER_DEFAULT_PASSWORD` in your local `.env`. Use strong local-only passwords. Do not commit `.env` or publish real login credentials.

## Commands

```powershell
npm run dev
npm run dev:server
npm run dev:client
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run prisma:studio
npm run typecheck
npm run lint
npm run test
npm run build
```

## Upload Storage

Files are stored outside PostgreSQL. Local development uses disk storage. Vercel production must use Vercel Blob by setting `STORAGE_DRIVER=vercel_blob` and configuring Blob credentials in Vercel environment variables. Runtime uploads are ignored by Git. Public assets may be served from these paths when intentionally published:

```text
uploads/profiles
uploads/skills
uploads/gallery/covers
uploads/gallery/images
uploads/achievements/images
uploads/achievements/certificates
uploads/thumbnails
```

ICC complaint attachments are private runtime data under `uploads/private/icc` and are served only through authenticated, authorized API download routes.

## GitHub And Vercel Deployment

This project is prepared as one GitHub repository named `singa-pen-portal`. Do not split the React/Vite frontend and Express/Prisma backend into separate repositories.

Vercel build settings:

```text
Build command: npm run build
Output directory: dist
API entrypoint: api/index.ts
```

`api/index.ts` imports the shared Express app from `server.ts` and exports it for Vercel. The Vercel function does not call `app.listen()`. Local development still runs `server.ts` on port `5000` through `npm run dev`.

`vercel.json` keeps `/api/*` and `/uploads/*` on the Express function and sends all other paths to `index.html`, so React Router direct refreshes work without swallowing API requests.

Production environment variables are listed in `.env.production.example`. Configure real values in the Vercel dashboard or with `vercel env add`; never commit real secrets. Use these public frontend values when frontend and API share the same Vercel domain:

```env
VITE_API_BASE_URL=/api/v1
VITE_UPLOAD_BASE_URL=
```

Production database setup:

```powershell
npm run db:migrate:deploy
```

This runs `prisma migrate deploy`. Never run `prisma migrate dev`, `prisma migrate reset`, destructive seeds, or force-reset commands against production. Pushing GitHub code does not copy local PostgreSQL rows or uploaded files to production; migrate real initial records deliberately and verify row counts before launch.

## Security Notes

- Never commit `.env` or real production secrets.
- Never run development seed against production.
- ICC attachments are private and must not be exposed by static file hosting.
- Production secrets belong in the hosting environment.
- Public Vite variables must never contain secrets.
- Talent Directory student search is restricted to authenticated Faculty/Admin users.
- Member photos in the repository are public source assets when hosted on GitHub.

## GitHub CI

GitHub CI runs:

- `npm ci`
- Prisma validation/generation
- TypeScript checks
- tests
- build

## Production Operations

The backend supports graceful shutdown, liveness/readiness health checks, and optional PM2 cluster supervision for VPS deployments. `npm start` remains the plain single-process production start command, and `npm run dev` remains the local Docker PostgreSQL + Express watcher + Vite workflow.

See [docs/deployment.md](docs/deployment.md) for server reliability, PM2, platform scaling, database pool, and runtime upload storage notes.

## GitHub Safety

This repository is prepared so source code can be committed without local secrets or runtime data. Keep these files and folders out of GitHub:

- `.env` and other real environment files
- `node_modules/`
- `dist/` and `dist-server/`
- `uploads/`, especially `uploads/private/`
- local database folders or dumps
- local logs, cache, screenshots, and temporary capture folders

## Troubleshooting

- PostgreSQL connection refused: start PostgreSQL or run `docker compose up -d postgres`.
- Docker password override: set `POSTGRES_PASSWORD` in your local `.env`.
- Incorrect database password: update `DATABASE_URL` or reset the local PostgreSQL password.
- Database does not exist: create `singa_pen_portal`.
- Port `5432` already in use: stop the conflicting PostgreSQL service or update `DATABASE_URL`.
- Prisma Client not generated: run `npm run prisma:generate`.
- Pending migrations: run `npm run prisma:migrate`.
- Migration failed: confirm `DATABASE_URL` credentials and database existence.
- JWT secret missing: copy `.env.example` to `.env` and set `JWT_SECRET`.
- CORS issue: confirm `CLIENT_URL=http://localhost:5173`.
- File upload issue: confirm `uploads/` is writable and files are valid JPG, PNG, WEBP, or PDF.
- Seed disabled: set `ALLOW_DESTRUCTIVE_SEED=true` only for a local development database.
