import { z } from 'zod';
import { paginationSchema } from '../../../utils/validators';

const severitySchema = z.enum(['low', 'medium', 'high']);

export const createRemarkSchema = z
  .object({
    remarkTypeId: z.number().int().positive(),
    categoryId: z.number().int().positive(),
    title: z.string().trim().min(10).max(255),
    description: z.string().trim().min(10).max(1000),
    severity: severitySchema.optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    isFlagged: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // severity validated in service after type lookup
    void data;
    void ctx;
  });

export const updateRemarkSchema = z
  .object({
    remarkTypeId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    title: z.string().trim().min(10).max(255).optional(),
    description: z.string().trim().min(10).max(1000).optional(),
    severity: severitySchema.nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    isFlagged: z.boolean().optional(),
    followUpNote: z.string().trim().max(1000).optional(),
    resolved: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const remarkListQuerySchema = paginationSchema.extend({
  typeId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
  studentId: z.string().uuid().optional(),
  resolvedStatus: z.enum(['open', 'resolved', 'all']).optional(),
});

export const remarkStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export type CreateRemarkInput = z.infer<typeof createRemarkSchema>;
export type UpdateRemarkInput = z.infer<typeof updateRemarkSchema>;
export type RemarkListQuery = z.infer<typeof remarkListQuerySchema>;
