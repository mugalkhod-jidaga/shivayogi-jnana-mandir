import { z } from 'zod';

export const createLookupValueSchema = z.object({
  value: z.string().trim().min(1).max(100),
});

export const updateLookupValueSchema = z
  .object({
    value: z.string().trim().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.value !== undefined || data.isActive !== undefined, {
    message: 'At least one field must be provided',
  });

export type CreateLookupValueInput = z.infer<typeof createLookupValueSchema>;
export type UpdateLookupValueInput = z.infer<typeof updateLookupValueSchema>;
