<<<<<<< HEAD
# Singa Pen - Women's Empowerment Cell Portal

Full-stack React, Express, PostgreSQL, and Prisma portal for the Singa Pen Women's Empowerment Cell initiative. It supports public pages, student/faculty/admin dashboards, student skills, faculty search, government schemes, site content, gallery albums, achievement records, and file uploads.

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
Uploads:  http://localhost:5000/uploads
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
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
CREATE DATABASE singa_pen_portal;
```

## First Run

```powershell
cd C:\Users\HP\Downloads\singa-pen-portal
npm install
Copy-Item .env.example .env
notepad .env
npx prisma generate
npm run prisma:migrate
npm run seed
npm run dev
```

Before `npm run seed`, set `SEED_DEFAULT_PASSWORD` and `WEC_MEMBER_DEFAULT_PASSWORD` in your local `.env` to strong local-only passwords. Do not commit `.env` or publish real login credentials.

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

## Prisma Models

- `User`
- `StudentProfile`
- `FacultyProfile`
- `Skill`
- `GovernmentScheme`
- `SiteContent`
- `GalleryAlbum`
- `GalleryImage`
- `Achievement`

Relations include user-to-profile cascade, student-to-skills cascade, gallery-album-to-images cascade, and achievement-to-student `SetNull` preservation.

## Local Accounts

Seeded local account identifiers are printed by the seed workflow and are intended only for your development database. Use the local-only password values configured in `.env`; do not place real Student, Faculty, Admin, or ICC credentials in GitHub documentation.

## Upload Storage

Files are stored on disk, not in PostgreSQL. The `uploads/` directory is runtime/private local data and is intentionally ignored by Git:

```text
uploads/profiles
uploads/skills
uploads/gallery/covers
uploads/gallery/images
uploads/achievements/images
uploads/achievements/certificates
uploads/thumbnails
```

## Troubleshooting

- PostgreSQL connection refused: start PostgreSQL or run `docker compose up -d postgres`.
- Incorrect database password: update `DATABASE_URL` or reset the local `postgres` password.
- Database does not exist: create `singa_pen_portal`.
- Port `5432` already in use: stop the conflicting PostgreSQL service or update `DATABASE_URL`.
- Prisma Client not generated: run `npm run prisma:generate`.
- Pending migrations: run `npx prisma migrate dev --name init_postgresql`.
- Migration failed: confirm `DATABASE_URL` credentials and database existence.
- JWT secret missing: copy `.env.example` to `.env` and set `JWT_SECRET`.
- CORS issue: confirm `CLIENT_URL=http://localhost:5173`.
- File upload issue: confirm `uploads/` is writable and files are valid JPG, PNG, WEBP, or PDF.
- Seed duplicate issue: seed clears tables in relational order before inserting demo data.

## GitHub Safety

This repository is prepared so source code can be committed without local secrets or runtime data. Keep these files and folders out of GitHub:

- `.env` and other real environment files
- `node_modules/`
- `dist/` and `dist-server/`
- `uploads/`
- local database folders or dumps
- local logs, cache, screenshots, and temporary capture folders

Use `<PASTE_GITHUB_REPOSITORY_URL_HERE>` as the placeholder remote URL until you create or choose the actual GitHub repository.
=======
# Women-s-cell-
>>>>>>> origin/main
