# PRD: Junk Removal Website

## Problem
Local junk removal companies lose jobs before the phone ever rings. Most competitors run a five-page template site, a Yelp listing, or nothing at all — slow to load, thin on content, no clear service area pages, and no fast way for a homeowner to request a quote. Meanwhile Google and AI answer engines (ChatGPT, Perplexity, Google AI Overviews) increasingly decide who gets recommended before a human ever clicks a link, and that decision is driven by structured, location-specific, trust-backed content most small operators don't have. The business is losing jobs to competitors who simply rank higher or respond faster — not because their service is worse.

## Target user & job-to-be-done
**Primary user — the homeowner/property manager searching for junk removal:** "I have junk I need gone this week. I want to know fast whether this company serves my area, roughly what it'll cost, and that they're legit — without calling five companies."

**Secondary user — the business owner:** "I want my website to generate booked jobs on autopilot, rank for every town I serve, and give me one place to see and respond to new leads — without hiring a marketing agency or a developer every time I want to add a service area."

## Value proposition (the wedge)
Speed-to-quote plus hyper-local proof. While competitors make customers call for a price, this site lets a customer submit photos and get a response fast, and every page is built around one ZIP code or town at a time so it outranks generic national chains and thin local directories — in both classic search and AI-generated answers.

## Product vision (the full build)
The finished product is a fast, mobile-first marketing site for a Greater Boston junk removal business, built on Next.js, with a public-facing layer and a private admin layer. The public layer includes a homepage, service pages (residential cleanouts, commercial cleanouts, furniture/appliance removal, estate cleanouts, construction debris, etc.), a scalable set of location landing pages covering every town/neighborhood served, a quote request flow with photo upload, a reviews/testimonials system, and a blog/resource section — all wrapped in technical SEO, local SEO, and GEO (generative engine optimization) best practices: structured data, fast Core Web Vitals, clean semantic HTML, and content formatted to be quoted directly by AI search tools.

The private layer is an admin dashboard where the owner manages incoming leads (view, respond, mark status), manages which towns/services have live pages, uploads before/after job photos, approves and publishes reviews, and edits key page content — all without touching code or redeploying. Analytics and call tracking tie every lead back to the page, channel, and keyword that produced it, so the owner knows what's actually generating revenue. The architecture is built so adding a new town, service, or even a second business location later is a content entry, not a rebuild.

## Phased delivery

### Phase 1 — Core Site & Lead Capture
**Goal:** A fast, credible, launchable website that turns visitors into phone calls and form submissions.
1. Homepage with hero, service overview, service area summary, trust signals (licensed/insured, years in business, reviews snippet), and primary CTA (call + quote form).
2. Core service pages (4–6): residential cleanout, commercial cleanout, furniture/appliance removal, estate/hoarding cleanout, construction debris, yard waste — each with description, process steps, pricing guidance, and CTA.
3. Quote request form (name, phone, email, address/ZIP, service type, description) with server-side validation and spam protection (honeypot + rate limiting).
4. Click-to-call elements throughout (sticky mobile call bar, header/footer phone links).
5. Static "service areas" page listing all towns covered (single page, not yet individual landing pages).
6. Contact page with map embed, hours, phone, email, and the quote form.
7. Mobile-first responsive design system (Tailwind), accessible markup (WCAG AA basics: contrast, focus states, alt text, semantic headings).
8. Base technical SEO: clean URL structure, meta titles/descriptions, Open Graph tags, XML sitemap, robots.txt, canonical tags.
9. Core Web Vitals optimization: image optimization/next/image, font loading strategy, lazy loading, target LCP < 2.5s on mobile.
10. Local business JSON-LD schema (NAP, hours, service area, phone) on homepage.
11. Google Analytics 4 + basic conversion events (form submit, phone click).
12. Lead notification: form submissions emailed to the owner immediately (no dashboard yet).
13. Hosting/deploy pipeline on Vercel with a custom domain and SSL.

### Phase 2 — Local SEO Scale
**Goal:** Rank for every town served, not just the brand name.
1. Location landing page template (dynamic route) covering each Greater Boston town/neighborhood served, with unique content blocks (local landmarks, service blurb, local testimonial if available).
2. Location × service combination pages where volume justifies it (e.g., "Furniture Removal in Cambridge, MA"), generated from structured data, not hand-written duplicates.
3. Internal linking system: homepage → service area hub → individual town pages, and cross-links between service pages and location pages.
4. Per-location LocalBusiness/Service schema with service area (GeoShape or areaServed) markup.
5. Breadcrumb schema and breadcrumb UI across service/location pages.
6. Dynamic sitemap generation that auto-includes new location/service pages.
7. Google Business Profile embed/sync (hours, reviews snippet, map) pulled into relevant pages.
8. Content governance rules/templates to keep location pages from reading as duplicate content (unique intro + local proof points required per page).

### Phase 3 — Conversion & Trust
**Goal:** Increase the percentage of visitors who actually request a quote.
1. Photo upload on the quote request form (direct-to-storage upload, e.g., S3/Cloudflare R2, with size/type limits and image compression).
2. Instant ballpark price estimator (simple rules-based calculator by job size/truck volume — not a binding quote, clearly labeled as an estimate).
3. Reviews/testimonials system: structured review content with Review/AggregateRating schema, displayed on homepage, service pages, and location pages.
4. Before/after job photo gallery, filterable by service type.
5. Trust bar: licensing/insurance info, years in business, guarantees (e.g., same-day service, eco-friendly disposal), payment methods accepted.
6. FAQ sections per service page with FAQPage schema.
7. Exit-intent or scroll-triggered secondary CTA (e.g., "Get a call back in 15 minutes") for visitors who haven't converted.
8. Form UX upgrade: multi-step quote form to reduce perceived friction, progress indicator, auto-save to localStorage.

### Phase 4 — Admin Dashboard & Lead Management
**Goal:** Give the owner one place to run the lead-gen side of the business without a developer.
1. Authenticated admin login (single user initially, email/password or magic link).
2. Lead inbox: list of all quote requests with status (new, contacted, quoted, booked, lost), notes, and uploaded photos.
3. Lead detail view with one-click call/text/email actions and status updates.
4. SMS + email notification on new lead (via Twilio/Resend) to the owner's phone.
5. Content management for location pages: add/edit/activate/deactivate a town without a code deploy.
6. Content management for reviews: submit, approve, publish/unpublish testimonials.
7. Photo library manager for before/after gallery and service page imagery.
8. Basic CMS for blog/resource posts (title, body, images, publish date, SEO fields).
9. Audit log of admin changes (who changed what, when) for basic accountability even as a single-operator tool.

### Phase 5 — GEO & Content Engine
**Goal:** Win recommendations inside AI search/chat answers, not just blue links.
1. Content restructuring pass: clear question-and-answer formatting, direct-answer-first paragraphs, and explicit facts (service area, pricing ranges, availability) that AI engines can extract and cite.
2. Expanded structured data: Service, Offer, AggregateRating, and Organization schema tied together consistently site-wide.
3. `llms.txt` and AI-crawler-friendly robots directives to explicitly welcome GEO indexing.
4. Blog/resource content plan targeting "how much does X cost," "how to dispose of Y," and other query patterns common in AI search.
5. Comparison/alternatives content (e.g., "junk removal vs. dumpster rental") structured for both human readers and AI summarization.
6. Internal content scoring checklist built into the admin CMS (does this page have a direct answer, schema, local specificity) before publishing.
7. Quarterly content refresh workflow: flag pages older than N months for review inside the admin dashboard.

### Phase 6 — Growth, Tracking & Expansion Infrastructure
**Goal:** Prove ROI channel-by-channel and make geographic/service expansion a config change.
1. Call tracking numbers per channel (Google Business Profile, Google Ads, organic, direct mail) with dynamic number insertion, so every lead source is attributable.
2. Full conversion tracking: GA4 + server-side events (form submit, call click, photo upload completion) feeding into Google Ads/Meta conversion APIs.
3. Simple A/B testing for homepage hero/CTA variants (self-hosted, e.g., feature-flag based).
4. CRM/field-service integration (e.g., Jobber, Housecall Pro, or a simple webhook) so booked leads sync to the tool the owner already uses to schedule jobs.
5. Automated review request flow: after a job is marked complete in the admin, trigger an SMS/email asking for a review with a direct link.
6. Expansion tooling: a "new market" wizard in the admin that scaffolds a new town's landing page, schema, and sitemap entry from a form, enabling non-developer geographic growth.
7. Monitoring/alerting: uptime check, Core Web Vitals regression alerts, broken-link checker run on a schedule.
8. Performance dashboard in admin summarizing leads by source, by town, and by service over time.

## Success metrics
- **Lead volume:** number of quote requests + tracked phone calls per month (primary business metric).
- **Conversion rate:** visitors → leads, by page type (homepage vs. service page vs. location page).
- **Local search visibility:** number of town/service page combinations ranking in top 10 for target keywords; Google Business Profile call/direction actions.
- **Core Web Vitals:** LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile for top 10 landing pages.
- **AI/GEO visibility:** manual tracking of whether the business is surfaced/cited in sample ChatGPT/Perplexity/Google AI Overview queries for target services + towns (qualitative, checked monthly).
- **Lead response time:** time from form submission to first owner contact (target under 15 minutes during business hours), measured via admin timestamps.
- **Review growth:** number of new published reviews per month post-Phase 6 automation vs. baseline.

## Risks & assumptions
- **Assumes the business has (or will generate) real photos, reviews, and testimonials** — without authentic local proof, the site is just another template; content quality depends on the owner supplying raw material (job photos, review requests) consistently.
- **Local SEO results are slow and not fully controllable** — ranking improvements from Phases 1–2 may take 3–6 months regardless of execution quality; success metrics should be tracked but not expected to move immediately.
- **GEO (AI search optimization) is an emerging, unstable target** — there's no established best practice or guaranteed inclusion in AI answers; Phase 5 work is a bet based on current patterns (direct answers, schema, citations) that may need to change as engines evolve.
- **One-person bandwidth risk:** the owner (if also running the junk removal business) needs to actually respond to leads and supply content; a great site with slow lead response or stale content undermines the whole investment.
- **Programmatic location pages carry a thin/duplicate content risk** if not enough unique local detail is added per page — Phase 2 must enforce real content variation, not just template + town-name swap, or Google may devalue the pages.
- **Photo upload and SMS/email notification features introduce third-party costs** (storage, Twilio/Resend) that scale with lead volume — need to monitor usage-based billing as the site succeeds.
- **No multi-tenant assumption:** this PRD assumes one business, one brand, one set of service areas. If the long-term goal is to resell this as a template/SaaS to other junk removal companies, that is a separate, later architectural decision (tenant isolation, billing, white-labeling) not covered in these phases.