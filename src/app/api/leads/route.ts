import { NextResponse } from 'next/server';

// POST /api/leads — submit a quote request.
//
// Not implemented yet: the full handler (Zod validation, honeypot, Upstash rate
// limit, DB write, Resend owner notification) is roadmap Phase 1, task 8.
// Until then this endpoint returns 501 so nothing can ever report a lead as
// received when it was not persisted.

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'Quote requests are not available yet.' },
    { status: 501 },
  );
}
