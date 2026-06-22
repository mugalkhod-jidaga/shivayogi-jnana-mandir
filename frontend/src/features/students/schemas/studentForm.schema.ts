import { z } from 'zod';
import { parseDobToIso } from '@/lib/date';
import { normalizeIndianPhone } from '@/lib/phone';

const parentStatusEnum = z.enum(['Both Alive', 'Single Mother', 'Orphan']);
const genderEnum = z.enum(['Male', 'Female', 'Other']);

const dobFieldSchema = z
  .string()
  .trim()
  .min(1, 'Date of birth is required')
  .transform((value, ctx) => {
    try {
      return parseDobToIso(value);
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Enter a valid date as DD/MM/YYYY',
      });
      return z.NEVER;
    }
  });

const familyDetailsFormSchema = z.object({
  fatherName: z.string().trim().max(100).optional(),
  motherName: z.string().trim().max(100).optional(),
  guardianName: z.string().trim().max(100).optional(),
  parentStatus: parentStatusEnum,
  annualIncome: z.string().optional(),
  primaryContact: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
  houseDetails: z.string().trim().max(255).optional(),
  villageTown: z.string().trim().min(1, 'Village / town is required').max(150),
  talukMandal: z.string().trim().min(1, 'Taluk / mandal is required').max(150),
  district: z.string().trim().min(1, 'District is required').max(150),
  state: z.string().trim().min(1).max(150),
  pincode: z.string().trim().min(6, 'Pincode is required').max(10),
});

export const createStudentFormSchema = z.object({
  admissionNumber: z.string().trim().min(1, 'Admission number is required').max(100),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100).optional(),
  dob: dobFieldSchema,
  gender: genderEnum,
  medicalAlerts: z.string().trim().max(2000).optional(),
  familyDetails: familyDetailsFormSchema,
});

export const updateStudentFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100).optional(),
  dob: dobFieldSchema,
  gender: genderEnum,
  medicalAlerts: z.string().trim().max(2000).optional(),
  familyDetails: familyDetailsFormSchema,
});

export type CreateStudentFormValues = z.infer<typeof createStudentFormSchema>;
export type UpdateStudentFormValues = z.infer<typeof updateStudentFormSchema>;

function mapFamilyDetails(family: CreateStudentFormValues['familyDetails']) {
  return {
    ...family,
    primaryContact: normalizeIndianPhone(family.primaryContact),
    annualIncome:
      family.annualIncome && family.annualIncome.trim() !== ''
        ? Number(family.annualIncome)
        : undefined,
  };
}

export function buildCreateStudentPayload(
  values: CreateStudentFormValues,
  lookupIds: { bloodGroupId?: string; admissionCategoryId?: string },
) {
  return {
    admissionNumber: values.admissionNumber,
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    dob: values.dob,
    gender: values.gender,
    bloodGroupId: lookupIds.bloodGroupId ? Number(lookupIds.bloodGroupId) : undefined,
    admissionCategoryId: lookupIds.admissionCategoryId
      ? Number(lookupIds.admissionCategoryId)
      : undefined,
    medicalAlerts: values.medicalAlerts || undefined,
    familyDetails: mapFamilyDetails(values.familyDetails),
  };
}

export function buildUpdateStudentPayload(
  values: UpdateStudentFormValues,
  lookupIds: { bloodGroupId?: string; admissionCategoryId?: string },
  includeFamily: boolean,
) {
  const payload: Record<string, unknown> = {
    firstName: values.firstName,
    lastName: values.lastName || null,
    dob: values.dob,
    gender: values.gender,
    bloodGroupId: lookupIds.bloodGroupId ? Number(lookupIds.bloodGroupId) : null,
    admissionCategoryId: lookupIds.admissionCategoryId
      ? Number(lookupIds.admissionCategoryId)
      : null,
    medicalAlerts: values.medicalAlerts || null,
  };

  if (includeFamily) {
    payload.familyDetails = mapFamilyDetails(values.familyDetails);
  }

  return payload;
}

export const deactivateStudentFormSchema = z.object({
  status: z.enum(['Alumni', 'Discontinued']),
  statusReason: z.string().trim().min(1, 'Reason is required').max(500),
});

export type DeactivateStudentFormValues = z.infer<typeof deactivateStudentFormSchema>;

export const defaultFamilyDetails: CreateStudentFormValues['familyDetails'] = {
  parentStatus: 'Both Alive',
  primaryContact: '',
  villageTown: '',
  talukMandal: '',
  district: '',
  state: 'Karnataka',
  pincode: '',
};
