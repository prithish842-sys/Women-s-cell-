# Production Security Checklist

## Secrets Policy

- Never commit `.env` or real credentials.
- Treat all `VITE_*` variables as public because they are bundled into browser JavaScript.
- Rotate any real secret that is ever committed, sent to the browser, pasted into logs, or shared outside the deployment platform.
- Do not place database URLs, JWT secrets, AI provider keys, Blob write tokens, or admin passwords in frontend code.

## Backend-Only Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PUBLIC_ORIGIN`
- `CLIENT_URL`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_PROVIDER_API_KEY`
- `GEMINI_API_KEY`
- `AI_MODEL`
- `AI_BASE_URL`
- `STORAGE_DRIVER`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`
- upload size limit variables

## Frontend-Safe Variables

- `VITE_API_BASE_URL`
- `VITE_UPLOAD_BASE_URL`

These must contain only public origins or relative paths. They must never contain secrets.

## Authentication Checks

- JWT signing and verification happen only on the backend.
- Production requires a strong `JWT_SECRET` of at least 32 characters.
- Login failures use generic wording to reduce account enumeration.
- Password changes require authentication and current-password verification.
- Password hashes are removed from API user responses.

## Role Matrix

- Public users may access only public content and public safety resources.
- Students may access only their own student profile, wellbeing data, saved schemes, notifications, skill requests, and workshop registrations.
- Faculty may access faculty routes and permitted student academic/contact views only.
- Admin users may access admin operational routes, but ICC details remain restricted to `ICC_ADMIN`.
- `ICC_ADMIN` can access ICC complaints and attachment downloads through explicit backend authorization.

## Upload Security

- Multer validates MIME type and extension.
- Server-side magic-byte checks validate JPG, PNG, WEBP, and PDF content.
- Upload filenames are generated randomly; original filenames are not trusted for storage paths.
- Size limits are configured by upload category.
- Production upload storage must use `STORAGE_DRIVER=vercel_blob`.

## Private File Policy

- Private ICC attachments, anonymous concern attachments, and admin reports must not be served by public static middleware.
- Private files require authenticated API requests and explicit authorization checks before streaming.
- Do not expose private Blob URLs to the frontend.

## CORS

- Do not use wildcard CORS for authenticated APIs.
- Configure `PUBLIC_ORIGIN`/`CLIENT_URL` to exact production origins.
- Preview deployment origins should be added intentionally, not by broad wildcard.

## Rate Limiting

- Login and registration are account/IP limited.
- AI wellbeing chat has its own limiter.
- ICC submissions, anonymous concern submissions, uploads, and search endpoints have endpoint-specific limiters.
- Current rate limiting is process-local. For multi-region or high-scale production, add shared Redis or another centralized rate-limit store.

## Security Headers

- Helmet is enabled.
- CSP uses default protections with `object-src 'none'` and `frame-ancestors 'none'`.
- Referrer policy is `no-referrer`.
- HSTS is enabled in production HTTPS mode.

## Production Logging

- Do not log passwords, password hashes, JWTs, authorization headers, database URLs, AI keys, or complaint bodies.
- Production error responses must not include stack traces, filesystem paths, Prisma internals, SQL details, or secret values.
- Server logs redact common secret patterns.

## Secret Rotation Steps

1. Remove the exposed value from code, logs, or configuration.
2. Generate a new secret in the provider dashboard.
3. Update the deployment platform environment variable.
4. Redeploy the app.
5. Revoke the old secret.
6. Review access logs for suspicious use.

## Post-Deployment Smoke Tests

- Public pages load without private data.
- `GET /api/v1/admin/dashboard` without JWT returns `401`.
- Student JWT cannot access admin or faculty-only APIs.
- Faculty JWT cannot access admin-only APIs or ICC complaint details.
- ICC attachment download requires owner or `ICC_ADMIN`.
- Admin report download requires `ADMIN`.
- Wellbeing check-ins and AI chat are visible only to the owning student.
- Invalid uploads are rejected.
- Production bundle does not contain `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, `GEMINI_API_KEY`, Blob tokens, or real passwords.
