# TODO — Phased build checklist

See ARCHITECTURE.md for full detail per item. Check off as implemented.

## Phase 1 — Core Site & Lead Capture
- [ ] Repo scaffold + Vercel + custom domain/SSL
  - [x] Local scaffold: Next.js 16 + TS + Tailwind 3.4 + Prisma 7 (pg adapter), ESLint, Vitest, CI workflow — typecheck/lint/tests/build verified against Postgres 17 (2026-11-23)
  - [ ] Neon project connected (needs owner's Neon account — connection strings in `.env` / Vercel)
  - [ ] Vercel project wired (needs GitHub repo + Vercel account; Neon integration)
  - [ ] Custom domain + SSL (domain not chosen yet)
- [x] Core schema v1 (BusinessProfile, Service, ServiceArea, QuoteRequest, LeadPhoto)
  - Migration `20261123201047_core_schema_v1` — applied to Postgres 17, catalog + 19 tests verified (2026-11-23)
- [ ] Design system: layout, header/footer, sticky mobile call bar, base components
- [ ] Homepage (hero, services overview, service-area summary, trust signals, CTA)
- [ ] Service pages (4–6, process steps, pricing guidance, CTA)
- [ ] Static service-areas page
- [ ] Contact page (map embed, hours, quote form)
- [ ] Quote request form + /api/leads (validation, honeypot, rate limit, email)
- [ ] Base technical SEO (meta/OG/sitemap/robots/canonical, a11y pass)
- [ ] Core Web Vitals pass (next/image, fonts, lazy loading, LCP < 2.5s)
- [ ] LocalBusiness JSON-LD on homepage
- [ ] GA4 + conversion events

## Phase 2 — Local SEO Scale
- [ ] Extend schema: isIndexable, LocationServicePage
- [ ] Dynamic location landing page template
- [ ] Location × service combo page template
- [ ] Internal linking + breadcrumb UI/schema
- [ ] Per-location LocalBusiness/Service schema
- [ ] Dynamic sitemap from DB
- [ ] Google Business Profile embed
- [ ] Content governance rules for unique local copy

## Phase 3 — Conversion & Trust
- [ ] Photo upload (presign + R2 + compression)
- [ ] Instant ballpark estimator (PricingRule + /api/estimate)
- [ ] Review schema + display + JSON-LD
- [ ] Before/after gallery with filter
- [ ] Trust bar component
- [ ] FAQ sections + FAQPage schema
- [ ] Exit-intent/scroll secondary CTA
- [ ] Multi-step quote form with autosave

## Phase 4 — Admin Dashboard & Lead Management
- [ ] Auth.js setup + AdminUser + protected /admin layout
- [ ] Lead inbox UI + filters
- [ ] Lead detail view + status history
- [ ] SMS + email new-lead notifications
- [ ] Location CMS (add/edit/activate towns + combo pages)
- [ ] Review CMS
- [ ] Photo library manager
- [ ] Blog CMS
- [ ] AuditLog write + viewer

## Phase 5 — GEO & Content Engine
- [ ] Direct-answer-first content restructuring pass
- [ ] Expanded structured data (Service/Offer/AggregateRating/Organization)
- [ ] llms.txt + AI-crawler robots directives
- [ ] Blog content plan + CMS support for cost/comparison/how-to posts
- [ ] Comparison/alternatives page template
- [ ] In-admin content scoring checklist
- [ ] lastReviewedAt + quarterly refresh workflow

## Phase 6 — Growth, Tracking & Expansion Infrastructure
- [ ] CallTrackingNumber + dynamic number insertion
- [ ] Server-side conversion pipeline (ConversionEvent + Ads/Meta APIs)
- [ ] A/B testing (Experiment/ExperimentAssignment + edge middleware)
- [ ] CRM/webhook integration (WebhookLog)
- [ ] Automated review-request flow (ReviewRequest + cron)
- [ ] New-market wizard (/api/admin/locations/scaffold)
- [ ] Monitoring/alerting (uptime, CWV, broken-link crons)
- [ ] Admin performance dashboard
