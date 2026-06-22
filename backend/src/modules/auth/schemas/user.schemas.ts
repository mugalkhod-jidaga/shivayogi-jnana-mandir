import { z } from 'zod';
import { phoneSchema } from '../../../utils/validators';

export const createStaffSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: phoneSchema,
  roleId: z.number().int().positive(),
});

export const updateStaffSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().max(100).nullable().optional(),
    roleId: z.number().int().positive().optional(),
  })
  .refine((data) => data.firstName !== undefined || data.lastName !== undefined || data.roleId !== undefined, {
    message: 'At least one field must be provided',
  });

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
