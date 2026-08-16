# Singa Pen - Women's Empowerment Cell Portal

Full-stack React, Express, PostgreSQL, and Prisma portal for the Singa Pen Women's Empowerment Cell initiative. It supports public pages, student/faculty/admin dashboards, student skills, faculty search, government schemes, site content, gallery albums, achievement records, ICC complaints, and file uploads.

## Stack

- React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Lucide, Motion
- Node.js, Express, TypeScript
- PostgreSQL on `localhost:5432`
- Prisma ORM and Prisma Client
- JWT authentication and bcrypt password hashing
- Multer uploads stored on disk under `uploads/`
- Vitest tests

## Local URLs

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Health:   http://localhost:5000/api/v1/health
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

Files are stored on disk, not in PostgreSQL. Runtime uploads are ignored by Git. Public assets may be served from these paths when intentionally published:

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
