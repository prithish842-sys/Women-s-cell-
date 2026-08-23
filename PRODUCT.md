# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from repository and brief: women students, faculty coordinators, administrators, ICC administrators, and public visitors using the Singa Pen Portal for opportunities, skills, safety resources, gallery content, and community information.

## Product Purpose

Singa Pen Portal is a Women's Empowerment Cell hub that helps users discover skills, schemes, opportunities, members, safety guidance, support resources, and campus/community updates. Success means the redesigned public and auth surfaces feel polished while preserving real API-backed data and secure workflows.

## Positioning

Inferred from the existing app: the portal combines empowerment content, skills discovery, safety support, ICC complaint flows, gallery storytelling, and role-based dashboards in one institution-facing web product.

## Operating Context

Users browse public pages, sign in or register, then use role-specific dashboards. Admin/faculty/student functionality, authentication, authorization, database records, uploads, and API contracts must remain intact.

## Capabilities and Constraints

Existing React/Vite frontend, Express API, Prisma/Postgres data model, and role-protected routes are binding. The uploaded reference screenshots define only the visual target; real app content, existing assets, API data, routes, and business logic remain authoritative. Screenshot-only names, portraits, logos, dates, and records must not be introduced as database truth.

## Brand Commitments

Confirmed by user brief and current code: product name is Singa Pen Portal; the official visual reference uses a white top nav, navy/blue/violet/magenta empowerment gradients, compact rounded cards, a shared dark footer, and recurring "She Leads. She Inspires. She Creates Change." hero language.

## Evidence on Hand

Uploaded screenshots for Skills, Safety, Gallery, Login, and Register, each with duplicate copies. Existing project assets live under `src/assets`, `public`, `assets`, and database/upload-backed content. No standalone hero character asset was identified in the brief; existing approved project assets should be reused where available.

## Product Principles

Preserve real records over screenshot filler.

Keep public pages fast, scannable, and responsive.

Make safety and complaint actions easy to find.

Respect role-based access and current API behavior.

Use visual fidelity to the references without compromising data integrity.

## Accessibility & Inclusion

Inferred requirement: the public portal should remain keyboard navigable, readable on mobile and desktop, and clear for safety/support situations where urgency and privacy matter.
