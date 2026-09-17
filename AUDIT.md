# Pre-Publication Audit — Singa Pen Portal

Compass. All findings cite `file:line`. Status written phase-by-phase; nothing fixed yet
(read-and-report pass). Fixes to come later, one BLOCKING item per commit.

---

## PHASE 0 — MAP

**Intended purpose (2 sentences):**
Singa Pen Portal is the web platform for a college **Women's Empowerment Cell**. It gives
students, faculty, and ICC/admins a member directory, skill & entrepreneur profiles,
government-scheme listings, workshops, achievements and photo gallery, plus safety tools —
ICC complaints, anonymous concerns, wellbeing check-ins with an AI companion, safety guides,
and an emergency SOS alert that notifies a student's vetted contacts by SMS/email.

### Language, framework, build, package manager
- Single TypeScript repo (`tsconfig.json`, ES2022, moduleResolution `bundler`).
- **Frontend:** React 19 + react-router-dom 7 SPA, built by **Vite 6** (`vite.config.ts`,
  `@vitejs/plugin-react`, `@tailwindcss/vite`), Tailwind 4 + styled-components + motion.
- **Backend:** **Express 4** API served by the same repo (`server.ts` → `server/routes/*`).
  Bundled with **esbuild** to `dist-server/server.mjs` (`package.json` `build:server`).
- **ORMs/data:** Prisma 6 (PostgreSQL) with a thin Mongoose-style repository shim
  (`server/models/base.ts`, `server/models/index.ts` — legacy MongoDB naming, now backed by
  Prisma). Everything parameterized through Prisma.
- **PM:** npm scripts in `package.json`; **both** `package-lock.json` (tracked) and
  `bun.lock` (gitignored) exist — manifest has `vite` in both deps and devDeps, and
  `@types/supertest`/`supertest`/`vitest`/`concurrently` live in `dependencies`. Installer
  drift risk: `npm ci` vs `bun install` can resolve the same range differently.

### Entry points
- Dev: `server.ts` (tsx watch) + `vite` on :5173, proxying `/api` and `/uploads` → :5000.
- Build: `npm run build` → client `dist/` + server `dist-server/server.mjs`.
- Serverless: `api/index.ts` re-exports the Express app → Vercel rewrites `/api/*` and
  `/uploads/*` to `/api/index` (`vercel.json`).
- Self-host: `dist-server/server.mjs` under PM2 (`ecosystem.config.cjs`).

### Where secrets/config are read from
- `dotenv.config()` in `server.ts` / `server/middleware/upload.ts`; `process.env` throughout.
- Server-only: `DATABASE_URL` (+ Neon aliases), `JWT_SECRET`, `JWT_EXPIRES_IN`,
  `AI_API_KEY|AI_PROVIDER_API_KEY|GEMINI_API_KEY`, `AI_MODEL`,
  `EMERGENCY_*_WEBHOOK_URL/_TOKEN`, `SEED_*`, `STORAGE_DRIVER`, `BLOB_READ_WRITE_TOKEN`,
  `BLOB_STORE_ID`, upload-size caps, `PUBLIC_ORIGIN`, `CLIENT_URL` (`server.ts:36-60`).
- Client-safe: `VITE_API_BASE_URL`, `VITE_UPLOAD_BASE_URL` (read in `src/utils/api.ts:4,55`).
- Boot validation: required envs enforced (server.ts:29-34), weak-JWT and localhost-origin
  rejection in production (server.ts:50-58), storage driver must be `vercel_blob` in prod.

### External services (everything this project talks to)
1. **PostgreSQL** — Docker `postgres:16` locally (docker-compose.yml, port 5435); Neon on prod.
2. **Vercel** — hosting; SPA from `dist`, full Express app as a single serverless function.
3. **Vercel Blob** — uploaded files in prod (`@vercel/blob` put/get/del).
4. **Google Gemini** — `generativelanguage.googleapis.com` (server → `aiWellness.ts:90`).
5. **Emergency SMS/email webhooks** — optional, env-configured, outbound only
   (`notificationService.ts:49-99`); not reachable until operators set the env vars.
6. No MongoDB, no other auth providers, no third-party analytics.

---

## PHASE 1 — SECURITY

### Secrets / git history
- Only `.env.example` and `.env.production.example` ever committed (verified with
  `git log --all --name-only`). No real `.env`, no private keys, no tokens in history.
- Code scan for key material found exactly one string, a **test-only** URL in CI config —
  `.github/workflows/ci.yml:14` (`postgresql://postgres:postgres@localhost:5432/...`). Not a
  credential; the real `DATABASE_URL` is passed via CI/env. **No leaked secrets.**
- `.neon` (tracked) holds only `orgId` — benign.

### Injection
- **SQL:** none found. All data access goes through Prisma (parameterized); the repository
  shim (`server/models/base.ts`) composes structured `where` objects; `$regex`→`contains`
  (`base.ts:123`) is parameterized.
- **Command/template/deserialization/prototype-pollution:** none found. No `eval`, no
  `child_process`, no template rendering of user input, no JSON.parse of user control beyond
  `requiredDocuments` (`base.ts:55-61`) which tolerates JSON.parse failures.
- **Path traversal:**
  - `server/middleware/upload.ts:102-108` guards `relativeUploadPath`; `sendPrivateStoredFile`
    re-applies `basename` (`upload.ts:216,233`); static uploads use `path.basename`
    (`server.ts:160`). These are contained.
  - **HIGH — arbitrary file deletion via admin-supplied `coverImage`:**
    `server/routes/admin.ts:1122` stores a body-controlled `coverImage` onto the album
    record; the next cover upload calls `deleteStoredFile(album.coverImage)` (`admin.ts:1108`),
    which does `path.join(process.cwd(), storedPath)` with **no containment check**
    (`upload.ts:192-199`). An admin (or anyone who compromises one admin token) can write
    `coverImage: "/uploads/../../server/.env"` and then replace the cover to delete arbitrary
    on-disk files in self-hosted (non-Vercel-Blob) deployments. Fix: never accept `coverImage`
    from the body (derive from upload only); resolve+contain in `deleteStoredFile`.

### AuthN / AuthZ
- JWT signed with `getJwtSecret()` (validated ≥32 chars in prod; auth.ts:9-19). `auth`
  middleware reloads the user from DB per request and rejects inactive accounts
  (`auth.ts:48-63`); `authorize()` checks the **DB** role, not the JWT claim (`auth.ts:89`) —
  role tampering in a token is harmless. Ownership checks are consistently applied in
  `student.ts`, `wellbeing.ts`, `emergency.ts` (owner-scoped `where` clauses on skill,
  notification, chat, emergency, wellbeing reads).
- **HIGH — every student's emergency PII readable by any FACULTY account:**
  `GET /emergency/admin/events` (`server/routes/emergency.ts:288`) authorizes
  `['ADMIN','ICC_ADMIN','FACULTY']`, and `serializeEvent` spreads the whole row
  (`emergency.ts:42-51`), which includes `perContactStatus` with each contact's
  `name/phone/relationship` (`emergency.ts:205-211`, stored at :226), plus lat/long,
  `locationLink`, and the student's raw message. A single compromised (or malicious) faculty
  account dumps the family/friend contact numbers of every student who ever triggered an SOS.
- **MEDIUM — unverified phone immediately trusted as an outbound alert target:**
  `ContactSchema` lets the client set `isVerified`/`isStaffContact` (`emergency.ts:20-21`);
  on trigger the number is dispatched to the admin-configured SMS/email webhook with the
  caller's chosen message and location (`emergency.ts:213-219`, `notificationService.ts:164`).
  When webhook channels are configured, a student account can be used to SMS/email arbitrary
  numbers through the portal and forge "SHARED" live-location links (location is fully
  client-supplied, `TriggerSchema` `emergency.ts:26-27`; marked trusted at :193-197).
- **MEDIUM — facility to deactivate every other administrator:**
  `PATCH /admin/users/:userId/status` (`admin.ts:390-408`) blocks only self-suspension;
  any ADMIN can suspend all other admins (system-availability, no hierarchy).
- **LOW — cross-department faculty write on role updates:**
  `PATCH /faculty/role-updates/:updateId/status` (`faculty.ts:317`) authorizes any FACULTY
  without scoping updates to that faculty member's department.
- **IDOR:** not found in the paths audited — all `:id` reads/writes in student/wellbeing/
  emergency/ICC are owner-scoped; admin routes are role-gated. Verified clean by direct read
  of `student.ts` and sub-agent pass over `admin.ts` (91 routes, all gated).

### Input validation / output encoding / XSS
- Server returns JSON only; no HTML rendering — no server template XSS.
- Client: **no `dangerouslySetInnerHTML`, no `eval`, no `innerHTML=` anywhere in `src/`**
  (sub-agent pass), so no reachable XSS sink for the stored site-content.
- **MEDIUM — stored content injection via site-content (admin-only but persistent):**
  `PUT /admin/site-content/:sectionKey` (`admin.ts:969-1002`) accepts raw `title/content` and
  arbitrary `metadata` with no zod schema, no sectionKey allowlist, no length cap. Surfaces on
  public pages. Compromise of one admin account persists arbitrary HTML/text across the site.
- **MEDIUM — multiple write routes bypass the zod pattern** (mass-assignment-ish / type bugs):
  `PUT /admin/students/:studentId` (`admin.ts:525-568`), `PUT /admin/faculty/:facultyId`
  (`admin.ts:756-789`) — note `:769` sets `isActive: true` on **any unrelated edit**, silently
  reviving suspended faculty accounts; gallery album/achievement create-update
  (`admin.ts:1007,1093,1426,1531`) accept raw bodies.
- **LOW — invalid enum strings → 500s:** unwhitelisted `status`/`studentId`/`functionalRole`
  filters at `admin.ts:1774,2175,2239,2324,2593-2594`.

### CORS / CSRF / headers / cookies
- Helmet with CSP/defaults + HSTS (`server.ts:66-79`), CORS allowlist from `PUBLIC_ORIGIN`
  (`server.ts:80-90`), JSON/Raw body limit 1MB (`server.ts:91-92`).
- No cookies — JWT in **localStorage** (`src/contexts/AuthContext.tsx:58,81`), documented as a
  planned Phase-2 migration in tests. Acceptable today only because no XSS sink exists; the
  anonymous-concern form nevertheless rides the authed axios instance and ships the Bearer
  header (`src/utils/api.ts:14-17`), silently de-anonymizing "anonymous" reporters
  (`src/pages/public/AnonymousConcern.tsx:25,71`) — **MEDIUM** (contradicts the feature's
  anonymity promise).

### File upload
- Strong baseline: MIME+extension whitelists, size caps, random filenames
  (`upload.ts:44-71`), **magic-byte signature validation** (`upload.ts:145-179`), and
  containment checks. SVG is excluded. Upload routes sit behind auth+authorize and per-path
  rate limiters (`server.ts:114-119,238-239`).
- **MEDIUM — unauthenticated storage-exhaustion via anonymous-concern attachments:**
  `POST /safety/anonymous-concerns` (`safety.ts:102,121`) allows up to 10 MB uploads with
  only a per-IP limiter (20/15min, `server.ts:235`) and **no purge path** — distributed
  submissions grow blob/disk indefinitely.
- **HIGH — dependency: multer DoS** (direct dep, `multer ^2.2.0`, fixed in ≥2.3.0):
  crafted multipart field names → CPU/oversized array DoS; **file-descriptor leak on aborted
  uploads** — both reachable from every authenticated upload route. `bun audit`:
  GHSA-535w-7cp7-47q4, GHSA-wc9g-mqfw-jrwm, GHSA-qfvm-cv95-jqjf. (The async-fileFilter
  bypass does **not** apply — our filters are synchronous.)

### Dependency vulnerabilities (`bun audit`)
Types: 13 reported (7 high, 5 moderate, 1 low). Reachable from this app:
- **HIGH — multer** (above). Fix: upgrade to `^2.3.0`.
- **HIGH — react-router <7.18.2** (CSRF-in-RSC-mode). Our app is a classic SPA BrowserRouter,
  so **likely not reachable** — bump anyway. (GHSA-qwww-vcr4-c8h2.)
- **MODERATE — morgan <1.12.0** log-forging (unicode separators) — reachable, request logging
  is our only logging; bump. (GHSA-jxfw-x594-9x9m.)
- **MODERATE — qs via body-parser** (array-limit bypass; isBuffer DoS) — reachable through
  `express.urlencoded({ extended: true })` (`server.ts:92`). Fixed upstream; bump express.
- Build-time only, not attacker-reachable at runtime: `nanoid`, `postcss`, `browserslist`,
  `baseline-browser-mapping` (via vite/autoprefixer).

### Rate limiting & resource exhaustion
- Per-route limiters are configured (`server.ts:95-147,230-239`), login key is
  `ip:identifier` — decent.
- **HIGH — unbounded anonymous aggregation on public endpoints:**
  `/public/statistics` loads all students+schemes+skills per request (`public.ts:126-144`);
  `/public/skills` loads all skills then does in-memory per-profile scoring fan-out
  (`public.ts:318,420-512`); `/public/gallery` does an N+1 `GalleryImages.find` per album with
  no cap (`public.ts:728`). Unauthenticated, uncached, unlimitered → CPU/memory exhaustion and
  serverless cost amplification. Prisma query patterns already exist to push filters into the
  DB (`public.ts:327-341`).
- **LOW — counselling-request notification flood:** every
  `POST /wellbeing/me/counselling-requests` writes a notification to *every* active admin
  (`wellbeing.ts:289-311`) with no per-user limiter.
- **LOW — emergency contact-count race** (`emergency.ts:78-84` count-then-create is not
  atomic; parallel POSTs exceed `MAX_CONTACTS`).

### Logging
- **MEDIUM — login debug logs leak account identifiers and emails:**
  `server/routes/auth.ts:338-341` logs the tried identifier, `:354-358` the email/identifier
  of an inactive account, `:377-381` the email of a failed password, `:393-398` full login
  success with email+identifier. Combined with morgan this stores PII in server logs; also
  quietly contradicts the `server.ts` redaction goal (redaction exists only in the error
  path, `auth.ts:27-33`). Remove these blocks.

### Fine (verified, not issues)
- No IDOR on emergency trigger targeting others' contacts; no SSRF in webhook service
  (URLs/tokens come from env only); no key exposure to clients; `/auth/me` never returns
  `passwordHash`; strict CORS + CSP + HSTS; failed-login wording is uniform
  (`INVALID_LOGIN_MESSAGE`) to blunt enumeration; upload signature checks genuine.

---

## PHASE 2 — DEAD WEIGHT

### DELETE — provably unused (no imports/references found)
| Path | Evidence |
|---|---|
| `src/App .tsx` (filename has a space) | byte-level clone of `src/App.tsx`; no importer references an `App .tsx` module |
| `src/pages/public/Home.backup.tsx` | no importer; only the live `Home.tsx` is routed (`src/App.tsx`) |
| `src/pages/public/Gallery.backup.tsx` | no importer |
| `src/pages/public/Schemes.backup.tsx` | no importer |
| `src/pages/public/SkillsDirectory.backup.tsx` | no importer |
| `server/utils/programLevel (1).ts` | byte-identical duplicate of `server/utils/programLevel.ts` (both read, identical content); importers resolve `programLevel` |
| `create_notification_type.sql` | one-off SQL; the `NotificationType` enum already ships in `prisma/migrations/20260729084500_workshop_registration_notifications` |
| `public/sw.js` | service worker never registered (`grep serviceWorker|sw.js` over `src` + `index.html` → 0 hits; only `manifest.webmanifest` is linked, `index.html:8`) |
| `tests/load/login-burst.mjs` (root `tests/`) | ad-hoc load script; matched by no test-runner config, needs undocumented `LOAD_TEST_*` env — developer-only artifact |
| `@google/genai` (`package.json:59`) | never imported anywhere (`server/`/`src/`/`scripts/`); AI calls use `fetch` directly (`aiWellness.ts:90`) |
| `@prisma/adapter-pg` + `pg` (`package.json:60,79`) | never imported; `PrismaClient` is constructed without a driver adapter (`server/config/prisma.ts:24`) |
| `page images/**` (45 tracked files) | ChatGPT mockup screenshots / design references — not referenced by code or docs |
| `events and gallery/**` (61 tracked files) | source event flyers/pictures — content provenance, not runtime assets |

### GIT-PRIVACY CLEANUP (do not ship in git, whether or not app/mockups reference them)
- `public/uploads/**` (51 tracked files) — includes **real named student member photos**
  (`public/uploads/members/womens-cell/*.jpeg`), **achievement certificate PDFs**, gallery
  event photos, and `demo_*.png` fixtures. Personal data does not belong in the repository;
  the app's runtime copies live in the gitignored `uploads/` and in Vercel Blob.
  The legacy `demo_*.png` whitelist serves from the gitignored `uploads/` root
  (`server.ts:161-166`), not from `public/`, so the `public/uploads/demo_*` copies are
  redundant with runtime storage.
- Do: add `public/uploads/` to `.gitignore` and prune history (`git filter-repo`) before
  going public.

### DON'T DELETE — here's why
| Path | Reason |
|---|---|
| `public/uploads/private/` | ICC/anonymous attachments are served through auth (not static); keep the gitignore rule toggling on it |
| `server/data/*.ts` (`verifiedGovernmentSchemes`, `verifiedSafetyResources`, `womensCellMembers`) | seed/provision source data used by `server/seeds/*`, `scripts/*` |
| `server/utils/*.ts` (`programLevel`, `progress`, `scheme`, `studentRoleUpdates`, `workshops`, `academic`, `skillRequests`) | all imported by live routes (`student.ts:5-11`, `admin.ts`) |
| `server/tests/*.test.ts` + root `tests/` dir | 60+ contract tests exist (Phase 3); they need a running Postgres |
| `public/manifest.webmanifest`, `public/icon.svg` | linked from `index.html:7-8` |
| `docs/*.md`, `SECURITY*.md`, `VERCEL_DEPLOYMENT.md`, `PRODUCT.md` | deployment/security docs |
| `.github/workflows/ci.yml`, `.github/dependabot.yml` | only automated checks that exist |
| `ecosystem.config.cjs` | PM2 self-host entry (`dist-server/server.mjs`) |
| `metadata.json` | dev-portal metadata; harmless |
| `scripts/*.ts/.ps1` | provision/admin tooling wired to `package.json` scripts |

### OTHER DRIFT/DEAD ITEMS
- `package.json` lists `vite` in **both** `dependencies` (`:86`) and `devDependencies` (`:106`).
- Test/dev-only packages sit in `dependencies`: `supertest`, `@types/supertest`, `vitest`,
  `concurrently` (`:63,85-87`) — belong in `devDependencies`.
- No ESLint config exists; `lint` script is just `tsc --noEmit` (`package.json:28-29`);
  `postcss.config.js` is an empty `export default {}` (Tailwind 4 Vite plugin doesn't need it).

---

## PHASE 3 — QUALITY & CORRECTNESS

### Error handling
- Consistent `try/catch → next(error)` in routes; `errorMiddleware` (`auth.ts:101-118`)
  redacts 5xx and strips stacks in production. Good baseline.
- **200-on-failure:** emergency trigger returns HTTP 200 with `success: false` when no
  channel is configured (`emergency.ts:245-251`) — callers must read the body over the status.
- Deliberate swallow: `aiWellness.ts:100-107` falls back to local replies on provider errors;
  `logStudentActivity` swallows (`student.ts:48-50`). Both intentional and safe.
- **PII in logs:** `auth.ts:338-398` (login DEBUG, Phase 1).

### Races & resource handling
- **Workshop capacity check is outside the write transaction:** the capacity gate reads
  `workshop.participations` *before* the `prisma.$transaction` (`student.ts:1028-1031` vs
  `:1043`); two concurrent registrations can both pass and oversubscribe a capped workshop.
- **Emergency contact-cap race:** count-then-create (`emergency.ts:78-84`) can exceed
  `MAX_CONTACTS` under concurrency.
- Graceful shutdown (`server.ts:280-298`) tracks connections + DB disconnect; fail-fast on
  uncaught errors. Correct.
- No file-handle/DB leaks in our code (multer FD leak is the dependency issue in Phase 1).

### Missing edge-case handling
- Unwhitelisted enum filters → uncaught Prisma validation → 500s (`admin.ts:1774,2175,2239,2324`).
- `/public/statistics`, `/public/skills`, `/public/gallery` load entire tables and fan out
  in memory with no pagination/cache/rate-limit for anonymous callers (`public.ts:126,318,728`).
- Health endpoint discloses `process.env.NODE_ENV` to anonymous callers (`server.ts:178`) — low.

### Test coverage
- ~60 tests across `server/tests/*.test.ts` — academic status, upload signatures, security
  guards, health/readiness/graceful-shutdown, admin/ICC gating, wellbeing AI fallback (behavioral
  authz tests at `security-hardening.test.ts:66-346`; several are source-contract assertions).
- **Critical paths with ZERO tests:** the coverImage/`deleteStoredFile` traversal
  (`admin.ts:1102-1124` + `upload.ts:185-200`); emergency `/admin/events` PII exposure
  (`emergency.ts:288`); faculty `isActive` auto-reactivation bug (`admin.ts:769`); public
  endpoint load behavior (`public.ts:126/318/728`); workshop-capacity race (`student.ts:1028`).
  Each Phase-5 BLOCKING fix will add a regression test.

### Type safety gaps
- The repository shim is intentionally untyped: `delegates`, `serialize`, `serializeRecord`
  are `any` (`base.ts:14,35,358`); routes re-`as any` liberally (`auth.ts:22`, `admin.ts:421`,
  `student.ts:34`). `tsc --noEmit` passes but does **not** type-check the domain model.

---

## PHASE 4 — PRODUCTION READINESS

| Area | Score | Justification / gap → how to raise |
|---|---|---|
| **Security** | 6/10 | Excellent baseline (helmet+CSP, CORS allowlist, JWT + per-request DB reload, rate limiters, magic-byte file checks). Deducted: admin file-deletion traversal, FACULTY emergency-PII read, multer DoS, anonymous public DoS, login-DEBUG PII. → 7+ by fixing B1–B5 below. |
| **Reliability** | 7/10 | Health/live/ready endpoints (`server.ts:168-228`), readiness gate, graceful shutdown, PM2 autorestart. Deducted: workshop-capacity + contact-cap races; no automated `migrate deploy`+smoke in CI. → 8 by fixing the races + CI migrate/smoke job. |
| **Observability** | 4/10 | Only `morgan` 'combined' + `console.error`; no request IDs, no structured logs, no error aggregation, no metrics; login-debug PII. → 7 by structured logger w/ request-ID + always-on redaction + error sink. |
| **Performance** | 5/10 | Unbounded anonymous aggregations (`public.ts`), N+1 gallery queries, zero caching, uploads served through API not CDN. → 7 by indexing/paging public queries + caching statistics. |
| **Documentation** | 6/10 | Strong README + `docs/deployment.md` + `VERCEL_DEPLOYMENT.md` + `SECURITY.md`. Gaps: **no LICENSE file**, README says Postgres `localhost:5432` while `docker-compose.yml` maps `5435` (`README.md` stack section), custom repository shim undocumented. → 7 by adding LICENSE, fixing port drift, documenting the model layer. |
| **Deployability** | 7/10 | `vercel.json` rewrites + `api/index.ts` + boot env validation + PM2 self-host. Deducted: **dual lockfiles** (`package-lock.json` tracked, `bun.lock` gitignored) cause installer drift; `vite` duplicated in deps/devDeps; seeding is manual scripts; single monolithic serverless function → cold starts. → 8 by single lockfile + dedupe + documented prod seed. |

Specifics present: health endpoints, graceful shutdown, prod env-validation on boot, CI
config. **Missing outright: LICENSE, structured logging, single locked install.**

---

## PHASE 5 — THE PLAN

Prioritized table. Rank = (severity × impact) / effort, high first. **BLOCKING** = must be
fixed before a public release. Everything else is NICE-TO-HAVE.

| # | Issue | Where | Sev | Impact | Effort | Score | Status |
|---|---|---|---|---|---|---|---|
| B1 | Arbitrary file deletion via body-supplied `coverImage` + uncontained `deleteStoredFile` | `admin.ts:1108/1122` + `upload.ts:185-200` | HIGH | File deletion on host (self-hosted) from one admin token | S | 9 | **BLOCKING** |
| B2 | Login DEBUG logs leak identifiers/emails | `auth.ts:338-398` | MED | PII persisted in logs | S | 8 | **BLOCKING** |
| B3 | All emergency-contact PII readable by any FACULTY | `emergency.ts:288` + `:44` | HIGH | Mass private-data disclosure (students + family/friends) | S | 8 | **BLOCKING** |
| B4 | multer DoS (dep) — field-name DoS + FD leak on abort | `package.json:78` (multer) | HIGH | Remote DoS on every upload route | S | 8 | **BLOCKING** |
| B5 | Unbounded anonymous aggregation (`/statistics`, `/skills`, `/gallery`) | `public.ts:126,318,728` | MED-HIGH | CPU/mem exhaustion + serverless cost without auth | M | 7 | **BLOCKING** |
| B6 | `react-router` 7.12–7.18.1 CSRF advisory (RSC-only) | `package.json:83` | MED | Not reachable in SPA mode today; low-cost hygiene | S | 6 | NICE (bump with B4) |
| B7 | `morgan` <1.12.0 log-forging + `qs` via `extended:true` | `server.ts:92-93` | MED | Log poisoning / qs DoS | S | 6 | NICE (bump with B4) |
| B8 | Unverified/fabricated emergency contacts + forged location dispatched to webhooks when configured | `emergency.ts:20-21,193-197` | MED | SMS/email abuse through portal; false "SHARED" location | S | 6 | **BLOCKING*** |
| B9 | Faculty `isActive:true` silently re-activates suspended accounts on any edit | `admin.ts:769` | MED | Suspended accounts regain access | S | 6 | **BLOCKING** |
| B10 | Stored content injection via `/site-content` (admin-only, persistent, public pages) | `admin.ts:969-1002` | MED | Persistent injection once one admin token is compromised | S | 6 | NICE |
| B11 | Anonymous-concern form de-anonymized by authed axios instance | `src/utils/api.ts:14-17` + `AnonymousConcern.tsx:25` | MED | Breaks an explicit anonymity promise | S | 6 | NICE |
| B12 | `/in-charges` leaks faculty emails on a public route | `public.ts:178` | MED | PII/phishing vector | S | 5 | NICE |
| B13 | Admin can suspend every other admin | `admin.ts:396` | LOW-MED | Availability footgun among admins | S | 4 | NICE |
| B14 | Cross-department faculty can flip any role-update status | `faculty.ts:317` | LOW-MED | AuthZ scoping gap | S | 4 | NICE |
| B15 | Unwhitelisted enum query params → 500 errors | `admin.ts:1774,2175,2239,2324` | LOW | Poor failure mode | S | 4 | NICE |
| B16 | Workshop registration capacity race | `student.ts:1028-1043` | LOW-MED | Oversubscribed workshops | M | 3 | NICE |
| B17 | Emergency contact-limit race | `emergency.ts:78-84` | LOW | Exceeds MAX_CONTACTS | S | 3 | NICE |
| B18 | Delete tracked PII & dev artifacts (Phase-2 lists) | `public/uploads/**`, `page images`, `events and gallery`, backups | MED | Privacy + repo bloat | M | 5 | NICE (pre-publish) |
| B19 | No LICENSE, README port drift (5432 vs 5435), dual lockfiles, dep dedupe | root | LOW | Release hygiene | S | 3 | NICE |

\* B8 is BLOCKING **only if** the emergency webhook channels will actually be configured in
production; with the channels unset (default) there is no outbound surface. Operators should
confirm before launch.

### Verdict — is this ready to publish?

**Not yet.** The engineering baseline is well above average: every route is role-gated, the
data layer is parameterized, uploads have signature validation, security headers and rate
limiters are on, and there are tests, health endpoints and a documented deploy path. But four
real, reachable HIGH issues (**B1** arbitrary file deletion, **B3** mass PII disclosure,
**B4** multer DoS, **B5** anonymous endpoint DoS) plus the PII-logging (**B2**) and the
suspension-reactivation bug (**B9**) are release-blockers. None are hard to fix.

### Top 3 things to fix first
1. **B1** — stop trusting body-provided `coverImage` and contain `deleteStoredFile`
   (one-line guard + route change; regression test for traversal + the legit delete).
2. **B3** — restrict `/admin/events` to `ADMIN`/`ICC_ADMIN` and/or strip `perContactStatus`
   from the admin payload; regression test asserting a FACULTY token gets no contact PII.
3. **B2 + B4** (same commit-sized chunks) — remove the login DEBUG blocks and bump
   `multer` (+ `morgan`, `react-router`, express for `qs`) to non-vulnerable versions;
   regression test asserting login responses/logs carry no identifier.
   Then **B5** (page + cache the public endpoints) and **B9** (don't force `isActive: true`).

Fixes will be applied one item per commit, diff-first, with a regression test per fix.