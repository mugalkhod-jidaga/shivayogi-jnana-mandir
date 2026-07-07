import { z } from 'zod';
import { dateInputSchema, paginationSchema } from '../../../utils/validators';

export const createBlockSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const updateBlockSchema = createBlockSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20),
  capacity: z.coerce.number().int().min(1).max(20).default(1),
  isActive: z.boolean().optional(),
});

export const updateRoomSchema = createRoomSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const createAllocationSchema = z.object({
  studentId: z.string().uuid(),
  bedId: z.coerce.number().int().positive(),
  allocatedFrom: dateInputSchema,
  notes: z.string().trim().max(1000).optional(),
});

export const transferAllocationSchema = z.object({
  studentId: z.string().uuid(),
  bedId: z.coerce.number().int().positive(),
  transferDate: dateInputSchema,
  notes: z.string().trim().max(1000).optional(),
});

export const dailyReportQuerySchema = z.object({
  date: dateInputSchema,
  blockId: z.coerce.number().int().positive().optional(),
});

export const occupancyReportQuerySchema = z.object({
  blockId: z.coerce.number().int().positive().optional(),
});

export const endAllocationSchema = z.object({
  allocatedTo: dateInputSchema,
  notes: z.string().trim().max(1000).optional(),
});

export const blockListQuerySchema = paginationSchema;
export const roomListQuerySchema = paginationSchema;
export const allocationListQuerySchema = paginationSchema.extend({
  blockId: z.coerce.number().int().positive().optional(),
  roomId: z.coerce.number().int().positive().optional(),
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type BlockListQuery = z.infer<typeof blockListQuerySchema>;
export type RoomListQuery = z.infer<typeof roomListQuerySchema>;
export type AllocationListQuery = z.infer<typeof allocationListQuerySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type TransferAllocationInput = z.infer<typeof transferAllocationSchema>;
export type EndAllocationInput = z.infer<typeof endAllocationSchema>;
export type DailyReportQuery = z.infer<typeof dailyReportQuerySchema>;
export type OccupancyReportQuery = z.infer<typeof occupancyReportQuerySchema>;
