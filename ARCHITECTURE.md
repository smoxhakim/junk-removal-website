# Architecture: Local Junk Removal Website

## Recommended stack

- **Framework:** Next.js 14+ (App Router), TypeScript — SSG/ISR for public pages (SEO-critical), server actions/route handlers for admin + forms, one deploy target for everything.
- **Hosting:** Vercel — zero-ops, preview deployments per PR, built-in image optimization, cron jobs, edge middleware for A/B testing.
- **Database:** PostgreSQL (Neon, serverless-friendly, branching for preview envs) — relational data (leads, locations, reviews, audit trails) fits SQL far better than a document store, and the full product needs real joins (location × service combos, lead → notes → status history).
- **ORM:** Prisma — type-safe queries, migrations, good fit for a solo dev who needs schema-as-code.
- **Styling/UI:** Tailwind CSS + shadcn/ui — fast to build accessible, consistent components without a design team.
- **Forms/validation:** React Hook Form + Zod (shared schemas between client and server).
- **File storage:** Cloudflare R2 (S3-compatible, no egress fees) for quote photos, before/after gallery, blog images. Direct-to-storage upload via presigned URLs.
- **Auth:** Auth.js (NextAuth) — credentials + email magic link, admin-only initially, role field built in from day one for future multi-editor use.
- **Email:** Resend (lead notifications, review requests, magic links).
- **SMS:** Twilio (lead SMS alerts, review request texts, call tracking numbers).
- **Rate limiting/cache:** Upstash Redis — rate-limit public POST endpoints, cache dynamic sitemap, store A/B experiment assignment lookups.
- **Analytics:** GA4 (client) + server-side conversion logging table forwarding to GA4 Measurement Protocol / Google Ads & Meta Conversion APIs (Phase 6).
- **Call tracking:** Twilio phone numbers with forwarding, tracked via `CallTrackingNumber` table + dynamic number insertion script (Phase 6); CallRail is a documented swap-in alternative if Twilio proves too much DIY.
- **Monitoring:** Vercel Analytics + UptimeRobot (free tier) + scheduled Lighthouse/PageSpeed Insights API check via cron (Phase 6).
- **CMS approach:** No third-party headless CMS. Content (locations, services, reviews, blog, settings) lives in Postgres, edited through the custom admin UI built in Phases 4–6. This avoids a second system to license/learn and keeps "add a town = a DB row" true to the PRD's non-negotiable.

Why not a headless CMS (Sanity/Contentful)? It would work, but adds a second service, cost, and sync surface for zero net benefit — the admin dashboard *is* the CMS per the PRD, and Postgres + Prisma already gives structured, query-able content for programmatic SEO pages.

## Data model

All tables include `id` (uuid, PK), `createdAt`, `updatedAt` unless noted.

### BusinessProfile
Singleton-ish table (supports a second row if the business expands locations later).
- `name`, `phone`, `email` string
- `address`, `city`, `state`, `zip` string
- `hours` json (day → open/close)
- `licenseNumber`, `insuranceInfo` string
- `yearsInBusiness` int
- `guarantees` string[]
- `paymentMethodsAccepted` string[]
- `googleBusinessProfileId` string nullable

### Service
- `slug` string unique
- `name`, `shortDescription` string
- `longDescription` text (mdx/markdown)
- `processSteps` json (ordered array of {title, body})
- `pricingGuidance` text
- `heroImage` string (R2 URL)
- `isActive` bool
- `metaTitle`, `metaDescription` string

### ServiceArea (town/location)
- `slug` string unique
- `name` string (town)
- `state`, `county` string
- `zipCodes` string[]
- `lat`, `lng` float
- `heroImage` string
- `introContent` text (unique copy per town — enforced non-null for publish)
- `localProofPoints` json (landmarks, local notes)
- `geoShape` json (schema.org GeoShape/areaServed data)
- `isActive` bool, `isIndexable` bool (allows staging a page before it's SEO-ready)
- `metaTitle`, `metaDescription` string

### LocationServicePage (combo pages, Phase 2)
- `locationId` FK → ServiceArea
- `serviceId` FK → Service
- `uniqueIntro` text — **required**, enforces no bare template+town-swap
- `isActive` bool
- `metaTitle`, `metaDescription` string
- unique constraint (`locationId`, `serviceId`)

### PricingRule (Phase 3 estimator)
- `serviceId` FK → Service
- `label` string (e.g. "1/4 truck load")
- `volumeFraction` float
- `basePrice` decimal
- `notes` text
- `order` int

### QuoteRequest (Lead)
- `name`, `phone`, `email` string
- `address`, `zip` string
- `serviceId` FK nullable → Service
- `locationId` FK nullable → ServiceArea (matched by zip)
- `description` text
- `estimatedPriceMin`, `estimatedPriceMax` decimal nullable
- `status` enum (`new`, `contacted`, `quoted`, `booked`, `lost`)
- `source` enum (`organic`, `gbp`, `ads`, `direct`, `referral`, `direct_mail`)
- `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent` string nullable
- `callTrackingNumberId` FK nullable → CallTrackingNumber
- `assignedAdminId` FK nullable → AdminUser

### LeadPhoto
- `leadId` FK → QuoteRequest
- `url`, `storageKey` string

### LeadNote
- `leadId` FK → QuoteRequest
- `adminUserId` FK → AdminUser
- `note` text

### LeadStatusHistory
- `leadId` FK → QuoteRequest
- `oldStatus`, `newStatus` enum
- `changedBy` FK → AdminUser

### Review
- `authorName` string
- `rating` int (1–5)
- `text` text
- `source` enum (`manual`, `google`, `review_request_flow`)
- `serviceId` FK nullable, `locationId` FK nullable
- `jobLeadId` FK nullable → QuoteRequest (ties review to completed job)
- `photoUrl` string nullable
- `isApproved` bool, `isPublished` bool

### GalleryPhoto (before/after)
- `serviceId` FK nullable, `locationId` FK nullable
- `beforeUrl`, `afterUrl` string
- `caption` string, `order` int
- `isPublished` bool

### BlogPost
- `slug` string unique
- `title`, `excerpt` string
- `body` text (mdx)
- `coverImage` string
- `status` enum (`draft`, `published`)
- `publishDate` datetime
- `authorId` FK → AdminUser
- `tags` string[]
- `metaTitle`, `metaDescription` string
- `lastReviewedAt` datetime (drives Phase 5 staleness flagging)

### AdminUser
- `email` string unique
- `passwordHash` string nullable (nullable to support magic-link-only accounts)
- `name` string
- `role` enum (`owner`, `editor`) — single owner at launch, extensible

### AuditLog
- `adminUserId` FK → AdminUser
- `action` enum (`create`, `update`, `delete`, `publish`, `unpublish`)
- `entityType` string, `entityId` uuid
- `diff` json (before/after)

### CallTrackingNumber (Phase 6)
- `number` string (E.164)
- `channel` enum (`gbp`, `ads`, `organic`, `direct_mail`, `referral`)
- `forwardToNumber` string
- `provider` enum (`twilio`)
- `isActive` bool

### ConversionEvent
- `type` enum (`form_submit`, `call_click`, `photo_upload_complete`)
- `leadId` FK nullable
- `page` string (path)
- `sessionId` string
- `utmSource`, `utmMedium`, `utmCampaign` string nullable

### Experiment (Phase 6 A/B testing)
- `key` string unique
- `name` string
- `variants` json (`[{key, weight}]`)
- `metricGoal` string
- `isActive` bool

### ExperimentAssignment
- `experimentId` FK → Experiment
- `visitorId` string (anon cookie id)
- `variant` string

### ReviewRequest (Phase 6 automation)
- `leadId` FK → QuoteRequest
- `channel` enum (`sms`, `email`)
- `sentAt` datetime
- `status` enum (`sent`, `delivered`, `clicked`, `completed`)
- `reviewLinkToken` string unique

### WebhookLog (CRM integration, Phase 6)
- `leadId` FK → QuoteRequest
- `destination` string (`jobber`, `housecallpro`, `custom`)
- `payload` json
- `status` enum (`success`, `fail`)
- `responseCode` int

### SiteSetting
- `key` string unique
- `value` json
(generic key/value escape hatch for trust-bar copy, feature toggles, homepage hero variant config, etc. — avoids a schema migration for every small content need)

**Relations summary:** ServiceArea 1—N LocationServicePage N—1 Service; QuoteRequest N—1 ServiceArea/Service, 1—N LeadPhoto/LeadNote/LeadStatusHistory, 1—1 ReviewRequest; Review N—1 ServiceArea/Service/QuoteRequest; AdminUser 1—N AuditLog/BlogPost/LeadNote.

## System components

- **Public site (Next.js App Router, SSG/ISR):** homepage, service pages, location pages, location×service pages, blog, reviews, gallery, contact. Rendered statically at build/revalidate time; location and combo pages generated from DB rows via `generateStaticParams` + ISR (`revalidate` on content change via on-demand revalidation triggered from admin saves).
- **Admin app (`/admin/*`, Next.js, auth-gated, dynamic rendering):** lead inbox, content editors (locations, services, reviews, blog, settings), photo library, audit log, dashboard stats, new-market wizard.
- **API layer (Route Handlers under `/app/api`):** public lead/estimate/upload/tracking endpoints, admin CRUD endpoints, cron endpoints, webhook receivers.
- **Database (Postgres via Neon + Prisma):** single source of truth for all content and lead data.
- **Object storage (Cloudflare R2):** quote-request photos, before/after gallery, blog/service imagery — all via presigned PUT URLs from the API.
- **Background/scheduled jobs (Vercel Cron):** sitemap rebuild, review-request dispatch, content-staleness flagging, uptime/CWV checks, broken-link checker.
- **Notification layer:** Resend (email) + Twilio (SMS) triggered from lead-creation and review-request flows.
- **Analytics/tracking layer:** GA4 client tags + `ConversionEvent` table + server-side forwarders to Ads/Meta Conversion APIs.
- **Edge middleware:** experiment variant assignment (cookie-based), basic bot/rate-limit checks on form routes using Upstash Redis.

## API design

All public endpoints are rate-limited (Upstash) and Zod-validated. Admin endpoints require a valid Auth.js session with `role >= editor`; destructive/publish actions require `role = owner` where noted.

### Public — lead generation & content
| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/leads` | Submit quote request (honeypot + rate limit) | None |
| PATCH | `/api/leads/:id/photos` | Attach uploaded photo keys to a lead after client-side presigned upload | None (token-scoped to lead id) |
| POST | `/api/uploads/presign` | Get presigned R2 upload URL (photos, max size/type enforced) | None, rate-limited |
| POST | `/api/estimate` | Compute ballpark price from service + volume inputs (Phase 3) | None |
| POST | `/api/reviews` | Public review submission (goes to pending) | None, rate-limited |
| GET | `/api/service-areas/search?q=` | Town/zip autocomplete for forms | None |
| POST | `/api/track/event` | Log a conversion event (call click, etc.) server-side | None |
| GET | `/sitemap.xml` | Dynamic sitemap incl. all active location/service/combo/blog pages | None |
| GET | `/robots.txt` | Robots directives (incl. AI-crawler allowances, Phase 5) | None |
| GET | `/llms.txt` | GEO-friendly structured summary (Phase 5) | None |

### Public — webhooks
| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/webhooks/twilio/status` | Inbound SMS/call delivery status updates | Twilio signature verification |
| POST | `/api/webhooks/review-link/:token` | Tracks review-request link click/completion | Token-based |

### Admin — auth
| Method | Path | Purpose | Auth |
|---|---|---|---|
| * | `/api/auth/[...nextauth]` | Sign-in (credentials + magic link), session | Public (login flow itself) |

### Admin — leads
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/admin/leads` | List leads, filter by status/source/date/town | Admin |
| GET | `/api/admin/leads/:id` | Lead detail incl. photos, notes, status history | Admin |
| PATCH | `/api/admin/leads/:id` | Update status/assignment | Admin |
| POST | `/api/admin/leads/:id/notes` | Add note | Admin |
| POST | `/api/admin/leads/:id/send-review-request` | Trigger review request SMS/email | Admin |

### Admin — content (locations, services, combos, pricing)
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET/POST | `/api/admin/locations` | List / create town pages | Admin |
| GET/PATCH/DELETE | `/api/admin/locations/:id` | Edit / activate / delete a town | Admin |
| POST | `/api/admin/locations/scaffold` | New-market wizard: creates location + default combo pages + sitemap entry (Phase 6) | Owner |
| GET/POST | `/api/admin/services` | List / create services | Admin |
| GET/PATCH/DELETE | `/api/admin/services/:id` | Edit / delete service | Admin |
| GET/POST | `/api/admin/location-services` | List / create combo pages | Admin |
| PATCH/DELETE | `/api/admin/location-services/:id` | Edit / delete combo page | Admin |
| GET/POST | `/api/admin/pricing-rules` | Manage estimator pricing table | Admin |

### Admin — reviews, photos, blog
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/admin/reviews` | List reviews (pending/published) | Admin |
| PATCH | `/api/admin/reviews/:id` | Approve / publish / unpublish / edit | Admin |
| DELETE | `/api/admin/reviews/:id` | Remove review | Admin |
| GET/POST | `/api/admin/photos` | List / upload gallery photos (presigned) | Admin |
| DELETE | `/api/admin/photos/:id` | Remove photo | Admin |
| GET/POST | `/api/admin/blog` | List / create blog posts | Admin |
| GET/PATCH/DELETE | `/api/admin/blog/:id` | Edit / publish / delete post | Admin |
| GET | `/api/admin/content/stale` | Pages not reviewed in N months (Phase 5) | Admin |

### Admin — settings, users, ops
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET/PATCH | `/api/admin/settings` | Business profile + site settings | Admin |
| GET/POST | `/api/admin/users` | List / invite admin users | Owner |
| PATCH/DELETE | `/api/admin/users/:id` | Edit role / deactivate | Owner |
| GET | `/api/admin/audit-log` | Filterable audit trail | Admin |
| GET/POST | `/api/admin/call-tracking-numbers` | Manage tracked numbers per channel | Admin |
| GET/POST | `/api/admin/experiments` | Manage A/B tests | Owner |
| PATCH | `/api/admin/experiments/:id` | Activate/deactivate, adjust weights | Owner |
| GET | `/api/admin/dashboard/stats` | Leads by source/town/service, CWV summary | Admin |

### Cron (Vercel Cron, secret-header auth)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/cron/sitemap-rebuild` | Regenerate/cache dynamic sitemap |
| GET | `/api/cron/uptime-check` | Ping key pages, alert on failure |
| GET | `/api/cron/cwv-check` | PageSpeed Insights API sweep on top pages |
| GET | `/api/cron/broken-links` | Crawl internal links, report 404s |
| GET | `/api/cron/content-staleness` | Flag pages past review threshold |
| GET | `/api/cron/review-request-dispatch` | Send pending review requests for jobs marked complete |

## External services & integrations

- **Cloudflare R2** — object storage for all images/photos.
- **Resend** — transactional email (lead alerts, review requests, magic-link auth).
- **Twilio** — SMS alerts, review-request texts, call-tracking numbers/forwarding.
- **Google Analytics 4 + Google Tag Manager** — client-side analytics and tag management.
- **Google Ads / Meta Conversion APIs** — server-side conversion forwarding (Phase 6).
- **Google Business Profile** — embedded reviews/map/hours via public API or manual sync (Phase 2).
- **Upstash Redis** — rate limiting, experiment assignment cache, sitemap cache.
- **UptimeRobot** — uptime monitoring, free tier sufficient.
- **PageSpeed Insights API** — scheduled Core Web Vitals regression checks.
- **CRM/field-service webhook target** (Jobber, Housecall Pro, or generic) — outbound lead sync, Phase 6.
- **Cloudflare Turnstile (or Google reCAPTCHA v3)** — bot protection on public forms, layered with honeypot + rate limiting.

## Auth & security

- **Admin auth:** Auth.js with credentials provider (bcrypt-hashed passwords) and email magic-link provider; session via JWT cookie (httpOnly, secure, sameSite=lax).
- **Authorization:** `role` field (`owner`, `editor`) checked in every admin route handler/server action; owner-only actions (user management, experiments, market scaffolding) explicitly gated.
- **Public form protection:** honeypot field + Turnstile + Upstash rate limiting (per-IP and per-session) on `/api/leads`, `/api/reviews`, `/api/estimate`.
- **Input validation:** Zod schemas shared between client forms and server route handlers; reject/strip unexpected fields.
- **File upload safety:** presigned URLs scoped to specific key prefix, size limit (e.g. 10MB), MIME allowlist (jpeg/png/webp/heic), server-side verification after upload before marking lead/photo record valid.
- **Audit logging:** every admin create/update/delete/publish action writes an `AuditLog` row (before/after diff) — required even for a single operator per PRD.
- **Secrets:** all API keys (Twilio, Resend, R2, GA4) in Vercel environment variables, never client-exposed except GA4 measurement ID.
- **Transport/headers:** HTTPS enforced (Vercel default), CSP header restricting script sources, `X-Frame-Options: DENY` on admin routes, CSRF protection via Auth.js double-submit cookie on admin mutations.
- **Webhook verification:** Twilio request signature validation on inbound webhooks.
- **Data retention:** leads and photos retained indefinitely by default; no PII beyond what's needed for a quote (name/phone/email/address) — documented in a privacy policy page.

## Deployment

- **Hosting:** Vercel (Next.js-native), custom domain + managed SSL.
- **Environments:** `production` (main branch), automatic preview deployments per PR, each preview gets a branched Neon Postgres database for safe schema testing.
- **Database migrations:** Prisma Migrate; `prisma migrate deploy` runs as a Vercel build step against production on merge to main.
- **CI:** GitHub Actions — typecheck, lint, Prisma schema validation, and a Lighthouse CI budget check on PRs before merge (fails build if LCP/CLS budgets regress on key templates).
- **Cron:** Vercel Cron Jobs calling the `/api/cron/*` endpoints on schedule (nightly sitemap rebuild, daily uptime/CWV, weekly broken-link/staleness checks, hourly review-request dispatch).
- **Backups:** Neon automated daily snapshots + point-in-time recovery (built into plan).
- **Image delivery:** Vercel Image Optimization in front of R2-hosted originals.
- **Rollback:** Vercel instant rollback to prior deployment; DB migrations written additive-first (no destructive migration without a manual backup checkpoint).

## Development roadmap

### Phase 1 — Core Site & Lead Capture
1. Repo scaffold: Next.js + TS + Tailwind + Prisma + Neon connected, Vercel project wired, custom domain/SSL. *(0.5 day)*
2. Core schema v1: `BusinessProfile`, `Service`, `ServiceArea` (static list, no dynamic routing yet), `QuoteRequest`, `LeadPhoto` (schema only, upload comes Phase 3). *(1 day)*
3. Design system: Tailwind config, shared layout, header/footer, sticky mobile call bar, base components (button, card, section). *(2 days)*
4. Homepage (hero, services overview, service-area summary, trust signals, CTA). *(1.5 days)*
5. Service pages (static, 4–6 pages from `Service` table, including process steps + pricing guidance + CTA). *(2 days)*
6. Static service-areas page (single page listing all towns, from `ServiceArea` table, no individual pages yet). *(0.5 day)*
7. Contact page: map embed, hours, phone/email, quote form. *(1 day)*
8. Quote request form + `/api/leads` route: Zod validation, honeypot, Upstash rate limit, writes to DB, sends Resend email to owner. *(1.5 days)*
9. Base technical SEO: meta tags, OG tags, static sitemap.xml/robots.txt, canonical tags, semantic HTML pass, accessibility pass (contrast/focus/alt text). *(1.5 days)*
10. Core Web Vitals pass: next/image everywhere, font strategy, lazy loading, Lighthouse CI target LCP < 2.5s. *(1 day)*
11. LocalBusiness JSON-LD schema on homepage. *(0.5 day)*
12. GA4 integration + conversion events (form submit, phone click). *(0.5 day)*

**Phase 1 total: ~12 days.** Shippable/testable: live marketing site, real leads arriving by email.

### Phase 2 — Local SEO Scale
1. Extend schema: `isIndexable` on `ServiceArea`, add `LocationServicePage` table + unique-content constraint. *(0.5 day)*
2. Dynamic location landing page template (`/service-areas/[slug]`) with ISR, unique content blocks, local testimonial slot. *(2 days)*
3. Location × service combo page template (`/[location]/[service]`) generated from `LocationServicePage` rows. *(1.5 days)*
4. Internal linking system: service-area hub ↔ town pages ↔ service pages cross-links, breadcrumb UI + schema. *(1.5 days)*
5. Per-location LocalBusiness/Service schema with `areaServed`/GeoShape. *(1 day)*
6. Dynamic `/sitemap.xml` generated from DB (active + indexable pages only), cached via Upstash, rebuilt on cron. *(1 day)*
7. Google Business Profile embed (hours/reviews/map) on relevant pages. *(1 day)*
8. Content governance: admin-side (manual DB entry for now) enforcement that `introContent`/`uniqueIntro` can't be empty/duplicate before `isActive=true`. *(0.5 day)*

**Phase 2 total: ~9 days.** Shippable/testable: N town pages live and indexed, each with unique content and schema.

### Phase 3 — Conversion & Trust
1. Photo upload: `/api/uploads/presign` + R2 bucket, client direct upload, `PATCH /api/leads/:id/photos`, compression on client before upload. *(2 days)*
2. `PricingRule` schema + instant ballpark estimator UI + `/api/estimate`, clearly labeled as non-binding. *(2 days)*
3. Review schema + display components (homepage/service/location pages) + Review/AggregateRating JSON-LD. Seed via manual DB entry (admin UI comes Phase 4). *(1.5 days)*
4. Before/after gallery (`GalleryPhoto`) with service-type filter. *(1.5 days)*
5. Trust bar component (license/insurance, years in business, guarantees, payment methods) pulling from `BusinessProfile`. *(0.5 day)*
6. FAQ sections per service page + FAQPage schema. *(1 day)*
7. Exit-intent/scroll-triggered secondary CTA. *(1 day)*
8. Multi-step quote form with progress indicator + localStorage auto-save. *(2 days)*

**Phase 3 total: ~11.5 days.** Shippable/testable: photo-attached leads, visible reviews/gallery, improved form completion.

### Phase 4 — Admin Dashboard & Lead Management
1. Auth.js setup: credentials + magic link, `AdminUser` table, protected `/admin` layout. *(1.5 days)*
2. Lead inbox UI: list + filters (`GET /api/admin/leads`), status badges. *(1.5 days)*
3. Lead detail view: photos, notes, one-click call/text/email, status update, `LeadStatusHistory` write. *(1.5 days)*
4. SMS + email new-lead notification to owner (Twilio + Resend) on `QuoteRequest` creation. *(1 day)*
5. Location CMS: add/edit/activate/deactivate town + combo pages via admin UI (wraps Phase 2 tables), triggers on-demand ISR revalidation. *(2 days)*
6. Review CMS: submit/approve/publish/unpublish. *(1 day)*
7. Photo library manager (gallery + service imagery). *(1 day)*
8. Blog CMS (create/edit/publish posts with SEO fields). *(1.5 days)*
9. `AuditLog` write on every admin mutation + audit log viewer. *(1 day)*

**Phase 4 total: ~11.5 days.** Shippable/testable: owner runs the whole lead/content lifecycle without touching code.

### Phase 5 — GEO & Content Engine
1. Content restructuring pass: direct-answer-first format applied to existing service/location pages (editorial + template changes). *(2 days)*
2. Expanded structured data: Service, Offer, AggregateRating, Organization schema unified site-wide via a shared schema-builder utility. *(1.5 days)*
3. `llms.txt` + AI-crawler-friendly robots directives. *(0.5 day)*
4. Blog content plan + CMS support for cost/comparison/how-to post types (tagging, templates). *(1 day)*
5. Comparison/alternatives page template (e.g. junk removal vs. dumpster rental). *(1 day)*
6. In-admin content scoring checklist (direct answer present / schema present / local specificity present) before publish. *(1.5 days)*
7. `lastReviewedAt` field + quarterly refresh workflow surfaced via `/api/admin/content/stale` + cron flag. *(1 day)*

**Phase 5 total: ~8.5 days.** Shippable/testable: pages pass internal GEO checklist, flagged-for-refresh workflow operating.

### Phase 6 — Growth, Tracking & Expansion Infrastructure
1. `CallTrackingNumber` schema + Twilio number provisioning + dynamic number insertion script per channel. *(2 days)*
2. Server-side conversion pipeline: `ConversionEvent` table, forwarders to GA4 Measurement Protocol + Google Ads/Meta Conversion APIs. *(2 days)*
3. A/B testing: `Experiment`/`ExperimentAssignment` tables, edge-middleware variant assignment, homepage hero/CTA variant support. *(2 days)*
4. CRM/webhook integration: `WebhookLog` table, outbound POST on lead status = booked, configurable destination. *(1.5 days)*
5. Automated review-request flow: `ReviewRequest` table, cron dispatch on job-complete, SMS/email with tracked link. *(1.5 days)*
6. New-market wizard: `/api/admin/locations/scaffold` — form-driven creation of location + default combo pages + sitemap entry. *(2 days)*
7. Monitoring/alerting: uptime cron, CWV regression cron, broken-link cron, alert via email/Slack webhook. *(1.5 days)*
8. Admin performance dashboard: leads by source/town/service over time (`/api/admin/dashboard/stats`). *(1.5 days)*

**Phase 6 total: ~14 days.** Shippable/testable: every lead attributable to a channel, review flywheel automated, expansion to a new town is a form submission.