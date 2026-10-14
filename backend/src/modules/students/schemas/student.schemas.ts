import { z } from 'zod';
import { aadhaarSchema, dateInputSchema, dobInputSchema, phoneSchema, satsIdSchema } from '../../../utils/validators';

const parentStatusEnum = z.enum(['Both Alive', 'Single Mother', 'Orphan']);
const studentStatusEnum = z.enum(['Active', 'Alumni', 'Discontinued']);
const genderEnum = z.enum(['Male', 'Female', 'Other']);
const satsTransferStatusEnum = z.enum(['Pending', 'Transferred', 'NotApplicable']);
/** 'NEW' is set automatically on first admission — never accepted from a client. */
const enrollmentTypeEnum = z.enum(['PROMOTED', 'TRANSFERRED', 'REPEATED']);

export const socialDetailsSchema = z.object({
  religionId: z.number().int().positive().optional(),
  socialCategoryId: z.number().int().positive().optional(),
  caste: z.string().trim().max(100).optional(),
  subCaste: z.string().trim().max(100).optional(),
  rdNumber: z.string().trim().max(50).optional(),
  rdNumberSecondary: z.string().trim().max(50).optional(),
});

export const updateSocialDetailsSchema = z.object({
  religionId: z.number().int().positive().nullable().optional(),
  socialCategoryId: z.number().int().positive().nullable().optional(),
  caste: z.string().trim().max(100).nullable().optional(),
  subCaste: z.string().trim().max(100).nullable().optional(),
  rdNumber: z.string().trim().max(50).nullable().optional(),
  rdNumberSecondary: z.string().trim().max(50).nullable().optional(),
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

/**
 * PATCH allows null to clear optional enrollment fields (e.g. section).
 *
 * `academicYearId` moving to a DIFFERENT year than the student's current
 * enrollment is a year transition, not an in-place edit — the repository
 * closes out the old enrollment row and inserts a new one so history is
 * preserved (see `students.repository.ts#updateEnrollment`). `enrollmentType`
 * is required in that case so the transition is recorded as PROMOTED /
 * TRANSFERRED / REPEATED rather than guessed after the fact.
 */
export const updateAcademicPlacementSchema = z.object({
  academicYearId: z.number().int().positive().optional(),
  standardId: z.number().int().positive().optional(),
  sectionId: z.number().int().positive().nullable().optional(),
  rollNumber: z.string().trim().min(1).max(20).optional(),
  previousSchool: z.string().trim().max(255).nullable().optional(),
  previousSchoolAddress: z.string().trim().max(2000).nullable().optional(),
  lastClassStudied: z.string().trim().max(100).nullable().optional(),
  enrolledAt: dateInputSchema.optional(),
  enrollmentType: enrollmentTypeEnum.optional(),
});

export const createStudentSchema = z.object({
  admissionNumber: z.string().trim().min(1).max(100).optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  /** English/Roman-script full name — optional search alias when firstName/lastName are in Kannada. */
  nameEnglish: z.string().trim().max(255).optional(),
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
    nameEnglish: z.string().trim().max(255).nullable().optional(),
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
    socialDetails: updateSocialDetailsSchema.optional(),
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
  socialCategoryId: z.coerce.number().int().positive().optional(),
});

const uuidArray = z.array(z.string().uuid());

/**
 * Batch year-end promotion. Two ways to pick the population:
 *   - `studentIds` omitted → every currently-enrolled Active student in
 *     `sourceStandardId` (minus `excludeStudentIds`).
 *   - `studentIds` provided → only those students (still filtered to
 *     `sourceStandardId` + Active by the RPC, as a safety net).
 * `holdbackStudentIds` marks students who repeat `sourceStandardId` instead
 * of advancing to `targetStandardId` — they still move to
 * `targetAcademicYearId`, just with `enrollment_type = 'REPEATED'`.
 * `excludeStudentIds` are skipped entirely (handled separately later).
 */
export const promoteStudentsSchema = z
  .object({
    targetAcademicYearId: z.number().int().positive(),
    sourceStandardId: z.number().int().positive(),
    // Omitted only when `sourceStandardId` is the final standard (students graduate to Alumni).
    targetStandardId: z.number().int().positive().optional(),
    studentIds: uuidArray.min(1).optional(),
    excludeStudentIds: uuidArray.default([]),
    holdbackStudentIds: uuidArray.default([]),
    dryRun: z.boolean().default(false),
  })
  .refine(
    (data) => !data.studentIds || data.excludeStudentIds.every((id) => !data.studentIds!.includes(id)),
    { message: 'A student cannot be in both studentIds and excludeStudentIds', path: ['excludeStudentIds'] },
  )
  .refine(
    (data) => !data.studentIds || data.holdbackStudentIds.every((id) => data.studentIds!.includes(id)),
    { message: 'holdbackStudentIds must be a subset of studentIds when studentIds is provided', path: ['holdbackStudentIds'] },
  )
  .refine((data) => data.holdbackStudentIds.every((id) => !data.excludeStudentIds.includes(id)), {
    message: 'A student cannot be in both holdbackStudentIds and excludeStudentIds',
    path: ['holdbackStudentIds'],
  });

export const promotionCandidatesQuerySchema = z.object({
  sourceStandardId: z.coerce.number().int().positive(),
  targetAcademicYearId: z.coerce.number().int().positive(),
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
export type UpdateSocialDetailsInput = z.infer<typeof updateSocialDetailsSchema>;
/**
 * GET /students/reports/enrollment-stats — defaults to the tenant's current
 * academic year. `status` is opt-in: omitted means the historical count for
 * that year regardless of what happened to the student since (the default
 * described to the user); passing it narrows to students whose CURRENT
 * status matches (e.g. `?status=Active` to hide since-departed students).
 */
export const enrollmentStatsQuerySchema = z.object({
  academicYearId: z.coerce.number().int().positive().optional(),
  standardId: z.coerce.number().int().positive().optional(),
  status: studentStatusEnum.optional(),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;
export type PromotionCandidatesQuery = z.infer<typeof promotionCandidatesQuerySchema>;
export type EnrollmentStatsQuery = z.infer<typeof enrollmentStatsQuerySchema>;
