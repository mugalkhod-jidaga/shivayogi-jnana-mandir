import { z } from 'zod';
import { dateInputSchema, paginationSchema } from '../../../utils/validators';

export const createSessionSchema = z.object({
  attendanceDate: dateInputSchema,
  blockId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateSessionSchema = z
  .object({
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const bulkAttendanceRecordSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        statusId: z.coerce.number().int().positive(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(500),
});

export const sessionListQuerySchema = paginationSchema.extend({
  attendanceDate: dateInputSchema.optional(),
  blockId: z.coerce.number().int().positive().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type BulkAttendanceRecordInput = z.infer<typeof bulkAttendanceRecordSchema>;
export type SessionListQuery = z.infer<typeof sessionListQuerySchema>;
