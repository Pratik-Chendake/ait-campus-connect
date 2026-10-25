import { z } from 'zod';

/**
 * Zod Validation Schema for Raw Scraped Unstop Opportunity Records
 */
export const RawUnstopOpportunitySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.string().min(3, 'Opportunity title must be at least 3 characters'),
  url: z.string().url('Opportunity must have a valid URL').refine(url => {
    // Reject generic homepage fallback
    const u = url.toLowerCase().trim();
    return u !== 'https://unstop.com' && u !== 'https://unstop.com/' && u.includes('unstop.com');
  }, { message: 'Opportunity URL must point to a specific listing page, not the generic homepage' }),
  type: z.string().optional().default('hackathons'),
  organization: z.string().optional().nullable().default('Unstop Partner'),
  mode: z.string().optional().nullable().default('Online'),
  registrationDeadline: z.string().optional().nullable(),
  registrationStart: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isPaidEntry: z.boolean().optional().nullable().default(false),
  teamSizeMin: z.number().int().positive().optional().nullable().default(1),
  teamSizeMax: z.number().int().positive().optional().nullable().default(4),
  totalPrizeCash: z.union([z.number(), z.string()]).optional().nullable(),
  prizes: z.array(z.any()).optional().nullable().default([]),
  skills: z.array(z.string()).optional().nullable().default([]),
  eligibility: z.array(z.string()).optional().nullable().default([]),
  description: z.string().optional().nullable().default(''),
  organizationLogo: z.string().optional().nullable()
}).passthrough();

/**
 * Validates a single opportunity record.
 * Returns { valid: boolean, data?: Object, error?: string }
 */
export function validateRawOpportunity(raw) {
  try {
    const data = RawUnstopOpportunitySchema.parse(raw);
    return { valid: true, data };
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      : err.message;
    return { valid: false, error: message };
  }
}

/**
 * Validates a batch of raw records, segregating valid and failed records
 */
export function validateOpportunityBatch(items) {
  const valid = [];
  const invalid = [];

  for (const item of items) {
    const res = validateRawOpportunity(item);
    if (res.valid) {
      valid.push(res.data);
    } else {
      invalid.push({ item, error: res.error });
    }
  }

  return { valid, invalid };
}
