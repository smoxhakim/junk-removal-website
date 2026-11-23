import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/leads (pre-task-8 stub)', () => {
  it('never reports success for a lead it has not stored', async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.ok).toBe(false);
  });
});
