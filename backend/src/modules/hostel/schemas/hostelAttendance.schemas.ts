import { z } from 'zod';
import { dateInputSchema, paginationSchema } from '../../../utils/validators';

export const sessionPeriodSchema = z.enum(['morning', 'evening']);

export const createSessionSchema = z.object({
  attendanceDate: dateInputSchema,
  sessionPeriod: sessionPeriodSchema.default('morning'),
  blockId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const ensureSessionSchema = z.object({
  attendanceDate: dateInputSchema,
  sessionPeriod: sessionPeriodSchema,
  blockId: z.coerce.number().int().positive().optional(),
});

export const dailyBoardQuerySchema = z.object({
  date: dateInputSchema,
  blockId: z.coerce.number().int().positive().optional(),
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
  sessionPeriod: sessionPeriodSchema.optional(),
  blockId: z.coerce.number().int().positive().optional(),
});

export type SessionPeriod = z.infer<typeof sessionPeriodSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type EnsureSessionInput = z.infer<typeof ensureSessionSchema>;
export type DailyBoardQuery = z.infer<typeof dailyBoardQuerySchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type BulkAttendanceRecordInput = z.infer<typeof bulkAttendanceRecordSchema>;
export type SessionListQuery = z.infer<typeof sessionListQuerySchema>;
