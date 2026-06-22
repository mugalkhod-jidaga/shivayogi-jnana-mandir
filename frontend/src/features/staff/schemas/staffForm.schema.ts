import { z } from 'zod';
import { normalizeIndianPhone } from '@/lib/phone';

export const createStaffFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z
    .string()
    .trim()
    .min(10, 'Enter a 10-digit mobile number')
    .max(10, 'Enter a 10-digit mobile number')
    .regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
  roleId: z.string().min(1, 'Choose a role'),
});

export type CreateStaffFormValues = z.infer<typeof createStaffFormSchema>;

export function buildCreateStaffPayload(values: CreateStaffFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    phone: normalizeIndianPhone(values.phone),
    roleId: Number(values.roleId),
  };
}
