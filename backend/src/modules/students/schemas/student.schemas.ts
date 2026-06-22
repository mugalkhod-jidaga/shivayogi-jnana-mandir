import { z } from 'zod';
import { dobInputSchema, phoneSchema } from '../../../utils/validators';

const parentStatusEnum = z.enum(['Both Alive', 'Single Mother', 'Orphan']);
const studentStatusEnum = z.enum(['Active', 'Alumni', 'Discontinued']);
const genderEnum = z.enum(['Male', 'Female', 'Other']);

export const familyDetailsSchema = z.object({
  fatherName: z.string().trim().max(100).optional(),
  motherName: z.string().trim().max(100).optional(),
  guardianName: z.string().trim().max(100).optional(),
  parentStatus: parentStatusEnum,
  annualIncome: z.coerce.number().nonnegative().optional(),
  primaryContact: phoneSchema,
  houseDetails: z.string().trim().max(255).optional(),
  villageTown: z.string().trim().min(1).max(150),
  talukMandal: z.string().trim().min(1).max(150),
  district: z.string().trim().min(1).max(150),
  state: z.string().trim().max(150).default('Karnataka'),
  pincode: z.string().trim().min(6).max(10),
});

export const createStudentSchema = z.object({
  admissionNumber: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  dob: dobInputSchema,
  gender: genderEnum.default('Male'),
  bloodGroupId: z.number().int().positive().optional(),
  admissionCategoryId: z.number().int().positive().optional(),
  medicalAlerts: z.string().trim().max(2000).optional(),
  familyDetails: familyDetailsSchema,
});

export const updateStudentSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().max(100).nullable().optional(),
    dob: dobInputSchema.optional(),
    gender: genderEnum.optional(),
    bloodGroupId: z.number().int().positive().nullable().optional(),
    admissionCategoryId: z.number().int().positive().nullable().optional(),
    medicalAlerts: z.string().trim().max(2000).nullable().optional(),
    status: studentStatusEnum.optional(),
    statusReason: z.string().trim().max(500).optional(),
    familyDetails: familyDetailsSchema.partial().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const deactivateStudentSchema = z.object({
  statusReason: z.string().trim().min(1).max(500),
  status: z.enum(['Alumni', 'Discontinued']).default('Discontinued'),
});

export const avatarPresignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(100).optional(),
});

export const avatarConfirmSchema = z.object({
  key: z.string().trim().min(1),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type DeactivateStudentInput = z.infer<typeof deactivateStudentSchema>;
export type FamilyDetailsInput = z.infer<typeof familyDetailsSchema>;
