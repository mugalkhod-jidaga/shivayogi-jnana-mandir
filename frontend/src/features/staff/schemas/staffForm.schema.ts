import { z } from 'zod';
import { normalizeIndianPhone } from '@/lib/phone';

export type StaffFormValidationMessages = {
  firstNameRequired: string;
  phone: string;
  roleRequired: string;
};

const DEFAULT_VALIDATION: StaffFormValidationMessages = {
  firstNameRequired: 'First name is required',
  phone: 'Enter a 10-digit mobile number',
  roleRequired: 'Choose a role',
};

export function buildCreateStaffFormSchema(messages: StaffFormValidationMessages = DEFAULT_VALIDATION) {
  return z.object({
    firstName: z.string().trim().min(1, messages.firstNameRequired).max(100),
    lastName: z.string().trim().max(100).optional(),
    phone: z
      .string()
      .trim()
      .min(10, messages.phone)
      .max(10, messages.phone)
      .regex(/^\d{10}$/, messages.phone),
    roleId: z.string().min(1, messages.roleRequired),
  });
}

export type CreateStaffFormValues = z.infer<ReturnType<typeof buildCreateStaffFormSchema>>;

export function buildCreateStaffPayload(
  values: CreateStaffFormValues,
  assignedStandardIds: number[] = [],
) {
  return {
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    phone: normalizeIndianPhone(values.phone),
    roleId: Number(values.roleId),
    assignedStandardIds: assignedStandardIds.length > 0 ? assignedStandardIds : undefined,
  };
}
