import { z } from 'zod';
import { aadhaarSchema, dateInputSchema, dobInputSchema, phoneSchema, satsIdSchema } from '../../../utils/validators';

const parentStatusEnum = z.enum(['Both Alive', 'Single Mother', 'Orphan']);
const studentStatusEnum = z.enum(['Active', 'Alumni', 'Discontinued']);
const genderEnum = z.enum(['Male', 'Female', 'Other']);
const satsTransferStatusEnum = z.enum(['Pending', 'Transferred', 'NotApplicable']);

export const socialDetailsSchema = z.object({
  religionId: z.number().int().positive().optional(),
  socialCategoryId: z.number().int().positive().optional(),
  caste: z.string().trim().max(100).optional(),
  subCaste: z.string().trim().max(100).optional(),
  rdNumber: z.string().trim().max(50).optional(),
  rdNumberSecondary: z.string().trim().max(50).optional(),
});

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

export const emergencyContactSchema = z.object({
  contactName: z.string().trim().min(1).max(100),
  relationship: z.string().trim().min(1).max(100),
  phone: phoneSchema,
});

export const academicPlacementSchema = z.object({
  academicYearId: z.number().int().positive(),
  standardId: z.number().int().positive(),
  sectionId: z.number().int().positive().optional(),
  rollNumber: z.string().trim().min(1).max(20),
  previousSchool: z.string().trim().max(255).optional(),
  previousSchoolAddress: z.string().trim().max(2000).optional(),
  lastClassStudied: z.string().trim().max(100).optional(),
  enrolledAt: dateInputSchema.optional(),
});

/** PATCH allows null to clear optional enrollment fields (e.g. section). */
export const updateAcademicPlacementSchema = z.object({
  academicYearId: z.number().int().positive().optional(),
  standardId: z.number().int().positive().optional(),
  sectionId: z.number().int().positive().nullable().optional(),
  rollNumber: z.string().trim().min(1).max(20).optional(),
  previousSchool: z.string().trim().max(255).nullable().optional(),
  previousSchoolAddress: z.string().trim().max(2000).nullable().optional(),
  lastClassStudied: z.string().trim().max(100).nullable().optional(),
  enrolledAt: dateInputSchema.optional(),
});

export const createStudentSchema = z.object({
  admissionNumber: z.string().trim().min(1).max(100).optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  dob: dobInputSchema,
  gender: genderEnum.default('Male'),
  bloodGroupId: z.number().int().positive().optional(),
  admissionCategoryId: z.number().int().positive().optional(),
  admissionDate: dateInputSchema,
  motherTongueId: z.number().int().positive().optional(),
  aadhaarNumber: aadhaarSchema.optional(),
  satsId: satsIdSchema.optional(),
  satsTransferStatus: satsTransferStatusEnum.optional(),
  academicPlacement: academicPlacementSchema,
  emergencyContacts: z.array(emergencyContactSchema).min(1),
  socialDetails: socialDetailsSchema.optional(),
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
    admissionDate: dateInputSchema.optional(),
    motherTongueId: z.number().int().positive().nullable().optional(),
    aadhaarNumber: aadhaarSchema.nullable().optional(),
    satsId: satsIdSchema.nullable().optional(),
    satsTransferStatus: satsTransferStatusEnum.optional(),
    academicPlacement: updateAcademicPlacementSchema.optional(),
    emergencyContacts: z.array(emergencyContactSchema).min(1).optional(),
    socialDetails: socialDetailsSchema.partial().optional(),
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

export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: studentStatusEnum.optional(),
  standardId: z.coerce.number().int().positive().optional(),
  sectionId: z.coerce.number().int().positive().optional(),
  academicYearId: z.coerce.number().int().positive().optional(),
  admissionCategoryId: z.coerce.number().int().positive().optional(),
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
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type AcademicPlacementInput = z.infer<typeof academicPlacementSchema>;
export type UpdateAcademicPlacementInput = z.infer<typeof updateAcademicPlacementSchema>;
export type SocialDetailsInput = z.infer<typeof socialDetailsSchema>;
export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
