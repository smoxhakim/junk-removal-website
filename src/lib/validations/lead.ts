import { z } from 'zod';

// Shared Zod schema for the quote request form — used by both the client
// (React Hook Form resolver) and the /api/leads route handler.

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(7, 'Valid phone number required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  zip: z.string().min(5, 'Valid ZIP required'),
  serviceId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  // Honeypot field — must stay empty; bots that fill it get rejected server-side.
  website: z.string().max(0).optional(),
  // TODO: add utm_* passthrough fields once tracking is wired (Phase 6)
});

export type LeadInput = z.infer<typeof leadSchema>;
