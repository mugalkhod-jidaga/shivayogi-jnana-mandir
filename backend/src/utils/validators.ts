import { z } from 'zod';
import { parseDobToIso } from './date';

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number (e.g., +919876543210)');

export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  throw new Error(`Unrecognized phone format: ${raw}`);
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const dobInputSchema = z
  .string()
  .trim()
  .min(1, 'Date of birth is required')
  .transform((value, ctx) => {
    try {
      return parseDobToIso(value);
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Enter a valid date as DD/MM/YYYY',
      });
      return z.NEVER;
    }
  });
