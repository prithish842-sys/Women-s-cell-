# Production Deployment

This project keeps local development and production separate.

## Local Development

Run the existing local workflow:

```powershell
npm run dev
```

`predev` runs `npm run db:up`, which starts the local Docker Compose PostgreSQL service named `postgres`. Docker Desktop or Docker Engine must be running locally. This workflow uses the local `.env` file and the local database URL.

Do not use destructive database commands such as `docker compose down -v`, `npx prisma migrate reset`, or `npx prisma db push --force-reset` unless you intentionally want to delete local data.

## Production Architecture

Production must not depend on the developer laptop or local Docker Desktop.

```text
Hosted React/Vite frontend
        |
        | HTTPS
        v
Hosted Express backend
        |
        | DATABASE_URL
        v
Managed PostgreSQL
```

The backend connects to any standard managed PostgreSQL provider through `DATABASE_URL`. No provider SDK is required for Prisma.

## Environment Variables

Backend host:

| Name | Secret | Required | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | Yes | Use `production` on the backend host. |
| `PORT` | No | Host-dependent | The backend uses `process.env.PORT` and falls back to `5000` locally. |
| `CLIENT_URL` | No | Yes in production | Deployed frontend origin, for CORS. Do not set this to localhost in production. |
| `DATABASE_URL` | Yes | Yes | Managed PostgreSQL connection string. Never expose this to Vite/frontend code. |
| `JWT_SECRET` | Yes | Yes | Strong production JWT secret. |
| `JWT_EXPIRES_IN` | No | Optional | Defaults are controlled by the app if omitted. |
| `ACADEMIC_YEAR_START_MONTH` | No | Optional | Existing academic-year setting. |
| Upload size variables | No | Optional | Keep existing names from `.env.example`. |

Frontend host:

| Name | Secret | Required | Notes |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | Yes | Public backend API URL, for example `https://api.example.com/api/v1`. |
| `VITE_UPLOAD_BASE_URL` | No | Yes if uploads are shown | Public backend origin, for example `https://api.example.com`. |

Never prefix backend secrets with `VITE_`; Vite bundles those values into browser JavaScript.

Use `.env.production.example` as a placeholder checklist only. Configure real secrets in the hosting platform, not in source control.

## Backend Deployment

1. Create a managed PostgreSQL database.
2. Configure backend environment variables in the backend host.
3. Install dependencies.
4. Generate Prisma Client and build:

```powershell
npm run build
```

5. Deploy migrations deliberately against the production database:

```powershell
npm run prisma:deploy
```

This runs `prisma migrate deploy`, which is the production-safe migration command. Do not run `prisma migrate dev`, `migrate reset`, or force-reset commands against production.

6. Start the compiled backend:

```powershell
npm start
```

The current production start command is:

```text
node dist-server/server.mjs
```

It starts only the Express backend. It does not start Docker, Vite, seed data, or the local development watcher.

7. Verify health:

```text
https://your-backend-domain.example/api/v1/health
https://your-backend-domain.example/api/v1/health/live
https://your-backend-domain.example/api/v1/health/ready
```

The original health endpoint confirms server and database connectivity without exposing secrets. Liveness confirms the Node process is alive. Readiness confirms the instance is ready to receive traffic and returns `503` during shutdown or database unavailability.

## Server Reliability & Scaling

The backend is still the same architecture:

```text
Load balancer / process manager / hosting platform
        |
        v
Stateless Express backend instance(s)
        |
        v
Shared managed PostgreSQL
```

### Graceful shutdown

The server keeps a reference to the Node HTTP server and coordinates shutdown in one place. On `SIGINT`, `SIGTERM`, `uncaughtException`, or `unhandledRejection`, the backend:

1. Marks the instance not ready.
2. Stops accepting new HTTP connections.
3. Lets active requests finish.
4. Disconnects Prisma.
5. Exits so the process manager or host can restart it when appropriate.

`GRACEFUL_SHUTDOWN_TIMEOUT_MS` defaults to `15000`. If requests do not finish before the timeout, remaining sockets are closed and fatal shutdowns exit non-zero.

### Health endpoints

Use these endpoints for operations:

| Endpoint | Purpose | Database dependency | Expected use |
| --- | --- | --- | --- |
| `/api/v1/health` | Backward-compatible server/database check | Yes | Existing checks and smoke tests |
| `/api/v1/health/live` | Process liveness | No | Process manager / container liveness |
| `/api/v1/health/ready` | Traffic readiness | Yes, bounded by `READY_DATABASE_TIMEOUT_MS` | Load balancer readiness |

During graceful shutdown, readiness returns `503` so a load balancer can stop routing new requests to the instance. Liveness may remain `200` until the process exits.

### HTTP server timeouts

The production server sets these environment-driven defaults:

| Variable | Default | Notes |
| --- | --- | --- |
| `SERVER_REQUEST_TIMEOUT_MS` | `120000` | Allows normal API, upload, and AI requests without hanging indefinitely. |
| `SERVER_HEADERS_TIMEOUT_MS` | `65000` | Bounds slow header delivery. |
| `SERVER_KEEP_ALIVE_TIMEOUT_MS` | `5000` | Keeps idle keep-alive sockets short-lived for reloads and deployments. |

Adjust only after measuring real request behavior.

### VPS process management with PM2

`npm start` remains the plain production command:

```powershell
npm start
```

For a VPS or self-hosted Node environment, PM2 can supervise and cluster the compiled backend:

```powershell
npm run build
npm run prisma:deploy
npm run start:pm2
pm2 status
npm run restart:pm2
npm run stop:pm2
```

`ecosystem.config.cjs` defaults `PM2_INSTANCES` to `2`. This is a conservative starting point for small deployments; it is not a capacity guarantee. You may set `PM2_INSTANCES=max` after load testing and after confirming PostgreSQL connection capacity.

PM2 is not used by `npm run dev`, does not start Docker, and does not run seeds or development migrations.

### Platform-native scaling

Render, Railway, Fly.io, AWS, Azure, GCP, and similar platforms may already supervise processes and run multiple replicas. In those environments, use the platform's native replica/scaling controls instead of forcing PM2, unless the platform explicitly recommends PM2.

### Stateless backend requirement

JWT authentication works across multiple backend replicas because user session authority is not stored in one Node process. Do not add business-critical per-user state in module-level `Map`, `Set`, arrays, or globals. Keep durable user data in PostgreSQL or another shared production store.

### Database connection pool considerations

Each backend replica owns its own Prisma connection pool. Keep this relationship within the managed PostgreSQL plan:

```text
replica count x connections per replica <= PostgreSQL connection capacity
```

Use provider-supported `DATABASE_URL` pool parameters only when your database host documents them. Do not assume unlimited horizontal scaling.

### Runtime upload limitation

Current file uploads are stored on the local server disk under `uploads/`. This is fine for local development and a single persistent backend host. With multiple physical backend replicas, a file uploaded to one replica may not exist on another replica.

For horizontally scaled production, move public uploads and private ICC/concern attachments to approved shared storage such as S3-compatible object storage, Cloudinary, or a secure shared persistent volume. ICC private attachments must remain private and served only through authorized backend routes.

### Capacity and load testing

These reliability changes prepare the app for future k6 or Artillery tests against liveness, readiness, public GET endpoints, and authenticated flows. They do not prove support for any fixed user count such as 2000 simultaneous users. Capacity must be measured with non-destructive load testing against an environment designed for that test.

## Frontend Deployment

1. Configure frontend build variables:

```env
VITE_API_BASE_URL=https://your-backend-domain.example/api/v1
VITE_UPLOAD_BASE_URL=https://your-backend-domain.example
```

2. Build static assets:

```powershell
npm run build:client
```

The Vite frontend output is `dist/`.

3. Deploy `dist/` to a static frontend host.

4. Configure SPA fallback so browser refresh works for routes such as:

```text
/members
/login
/student/dashboard
/faculty/dashboard
/admin/dashboard
```

The frontend host should serve `index.html` for unknown client-side routes.

## CORS

Set backend `CLIENT_URL` to the exact deployed frontend origin, for example:

```env
CLIENT_URL=https://your-frontend-domain.example
```

The backend does not use wildcard CORS. When real domains are available, verify the deployed frontend origin is accepted and unrelated origins are rejected.

## Data Migration Options

### Scenario A: Clean Production Database

Use only migrations:

```powershell
npm run prisma:deploy
```

Create any initial production accounts through an approved production process. Do not automatically seed development/demo data.

### Scenario B: Preserve Existing Local Data

Only do this after inventorying local data and confirming it should become production data.

1. Back up local Docker PostgreSQL:

```powershell
docker compose exec postgres pg_dump -U postgres -d singa_pen_portal -Fc -f /tmp/singa_pen_portal.dump
docker compose cp postgres:/tmp/singa_pen_portal.dump .\singa_pen_portal.dump
```

2. Restore to managed PostgreSQL using the provider's approved secure connection method, for example with `pg_restore` or `psql`.

Do not run a data restore to an unknown production database without explicit authorization and a verified target connection string.

## Post-Deployment Checks

Verify:

- Backend health endpoint.
- Public pages: Home, About, Members, Schemes, Gallery, Login.
- Student login, dashboard, schemes, notifications, logout.
- Faculty login, dashboard, search, direct refresh.
- Admin login, dashboard, protected admin pages.
- Unauthorized role blocking.
- HTTPS frontend calls HTTPS backend without mixed-content errors.
- Docker Desktop off on the developer laptop does not affect production.
