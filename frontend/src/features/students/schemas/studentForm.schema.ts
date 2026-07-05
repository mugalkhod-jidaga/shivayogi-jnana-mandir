import { z } from 'zod';
import { parseDobToIso, type DateParseMessages } from '@/lib/date';
import { normalizeIndianPhone } from '@/lib/phone';
import {
  validateKarnatakaRdNumbers,
  type RdValidationMessages,
} from '@/features/students/schemas/karnatakaRd.validation';

const parentStatusEnum = z.enum(['Both Alive', 'Single Mother', 'Orphan']);
const genderEnum = z.enum(['Male', 'Female', 'Other']);

export type StudentFormValidationMessages = {
  dateRequired: string;
  invalidDate: string;
  dobRequired: string;
  firstNameRequired: string;
  phone: string;
  contactNameRequired: string;
  relationshipRequired: string;
  rollNumberRequired: string;
  villageRequired: string;
  talukRequired: string;
  districtRequired: string;
  pincodeRequired: string;
  aadhaar: string;
  satsId: string;
  reasonRequired: string;
  admissionNumberRequired: string;
  dateParse: DateParseMessages;
  rd: RdValidationMessages;
};

const DEFAULT_VALIDATION: StudentFormValidationMessages = {
  dateRequired: 'Date is required',
  invalidDate: 'Enter a valid date as DD/MM/YYYY',
  dobRequired: 'Date of birth is required',
  firstNameRequired: 'First name is required',
  phone: 'Enter a 10-digit mobile number',
  contactNameRequired: 'Contact name is required',
  relationshipRequired: 'Relationship is required',
  rollNumberRequired: 'Roll number is required',
  villageRequired: 'Village / town is required',
  talukRequired: 'Taluk / mandal is required',
  districtRequired: 'District is required',
  pincodeRequired: 'Pincode is required',
  aadhaar: 'Aadhaar must be exactly 12 digits',
  satsId: 'SATS ID must be exactly 9 digits',
  reasonRequired: 'Reason is required',
  admissionNumberRequired: 'Admission number is required',
  dateParse: {
    required: 'Date of birth is required',
    invalidFormat: 'Use DD/MM/YYYY (e.g. 15/05/2010)',
    invalidYear: 'Enter a valid year',
    invalidMonth: 'Enter a valid month',
    invalidDay: 'Enter a valid day',
    invalidDate: 'Enter a valid date',
  },
  rd: {
    casteRdRequired: 'Valid Caste RD number required (e.g. RD1218...)',
    casteRdInvalid: 'Valid Caste RD number required (e.g. RD1218...)',
    incomeRdRequired: 'Valid Income RD number required',
    incomeRdInvalid: 'Valid Income RD number required',
    scStDifferent: 'SC/ST must have different Caste and Income RD numbers',
    obcIncomeMustMatch: 'OBC Income RD must match your Caste RD',
    gmIncomeInvalid: 'Invalid Income RD format',
  },
};

function buildDateFieldSchema(msg: StudentFormValidationMessages) {
  return z
    .string()
    .trim()
    .min(1, msg.dateRequired)
    .transform((value, ctx) => {
      try {
        return parseDobToIso(value, {
          ...msg.dateParse,
          required: msg.dateRequired,
        });
      } catch (error) {
        ctx.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : msg.invalidDate,
        });
        return z.NEVER;
      }
    });
}

export function buildStudentFormSchemas(msg: StudentFormValidationMessages = DEFAULT_VALIDATION) {
  const dateFieldSchema = buildDateFieldSchema(msg);

  const familyDetailsFormSchema = z.object({
    fatherName: z.string().trim().max(100).optional(),
    motherName: z.string().trim().max(100).optional(),
    guardianName: z.string().trim().max(100).optional(),
    parentStatus: parentStatusEnum,
    annualIncome: z.string().optional(),
    primaryContact: z.string().trim().regex(/^\d{10}$/, msg.phone),
    houseDetails: z.string().trim().max(255).optional(),
    villageTown: z.string().trim().min(1, msg.villageRequired).max(150),
    talukMandal: z.string().trim().min(1, msg.talukRequired).max(150),
    district: z.string().trim().min(1, msg.districtRequired).max(150),
    state: z.string().trim().min(1).max(150),
    pincode: z.string().trim().min(6, msg.pincodeRequired).max(10),
  });

  const emergencyContactFormSchema = z.object({
    contactName: z.string().trim().min(1, msg.contactNameRequired).max(100),
    relationship: z.string().trim().min(1, msg.relationshipRequired).max(100),
    phone: z.string().trim().regex(/^\d{10}$/, msg.phone),
  });

  const academicPlacementFormSchema = z.object({
    rollNumber: z.string().trim().min(1, msg.rollNumberRequired).max(20),
    previousSchool: z.string().trim().max(255).optional(),
    previousSchoolAddress: z.string().trim().max(2000).optional(),
    lastClassStudied: z.string().trim().max(100).optional(),
  });

  const satsTransferStatusEnum = z.enum(['Pending', 'Transferred', 'NotApplicable']);

  const socialDetailsFormSchema = z.object({
    caste: z.string().trim().max(100).optional(),
    subCaste: z.string().trim().max(100).optional(),
    rdNumber: z.string().trim().max(15).optional().or(z.literal('')),
    rdNumberSecondary: z.string().trim().max(15).optional().or(z.literal('')),
  });

  function applyRdValidation(
    data: {
      socialCategoryCode?: string;
      socialDetails?: z.infer<typeof socialDetailsFormSchema>;
    },
    ctx: z.RefinementCtx,
  ) {
    if (!data.socialDetails || !data.socialCategoryCode) return;

    const rdErrors = validateKarnatakaRdNumbers(
      data.socialCategoryCode,
      data.socialDetails.rdNumber,
      data.socialDetails.rdNumberSecondary,
      msg.rd,
    );

    if (rdErrors.rdNumber) {
      ctx.addIssue({
        code: 'custom',
        message: rdErrors.rdNumber,
        path: ['socialDetails', 'rdNumber'],
      });
    }
    if (rdErrors.rdNumberSecondary) {
      ctx.addIssue({
        code: 'custom',
        message: rdErrors.rdNumberSecondary,
        path: ['socialDetails', 'rdNumberSecondary'],
      });
    }
  }

  const createStudentFormSchema = z
    .object({
      admissionNumber: z.string().trim().min(1, msg.admissionNumberRequired).max(100),
      socialCategoryCode: z.string().optional(),
      firstName: z.string().trim().min(1, msg.firstNameRequired).max(100),
      lastName: z.string().trim().max(100).optional(),
      dob: dateFieldSchema,
      gender: genderEnum,
      admissionDate: dateFieldSchema,
      aadhaarNumber: z
        .string()
        .trim()
        .regex(/^\d{12}$/, msg.aadhaar)
        .optional()
        .or(z.literal('')),
      satsId: z
        .string()
        .trim()
        .regex(/^\d{9}$/, msg.satsId)
        .optional()
        .or(z.literal('')),
      satsTransferStatus: satsTransferStatusEnum.optional(),
      academicPlacement: academicPlacementFormSchema,
      emergencyContacts: z.array(emergencyContactFormSchema).min(1),
      socialDetails: socialDetailsFormSchema.optional(),
      familyDetails: familyDetailsFormSchema,
    })
    .superRefine(applyRdValidation);

  const updateStudentFormSchema = z
    .object({
      admissionNumber: z.string().trim().max(100).optional(),
      socialCategoryCode: z.string().optional(),
      firstName: z.string().trim().min(1, msg.firstNameRequired).max(100),
      lastName: z.string().trim().max(100).optional(),
      dob: dateFieldSchema,
      gender: genderEnum,
      admissionDate: dateFieldSchema,
      aadhaarNumber: z
        .string()
        .trim()
        .regex(/^\d{12}$/, msg.aadhaar)
        .optional()
        .or(z.literal('')),
      satsId: z
        .string()
        .trim()
        .regex(/^\d{9}$/, msg.satsId)
        .optional()
        .or(z.literal('')),
      satsTransferStatus: satsTransferStatusEnum.optional(),
      academicPlacement: academicPlacementFormSchema,
      emergencyContacts: z.array(emergencyContactFormSchema).min(1),
      socialDetails: socialDetailsFormSchema.optional(),
      familyDetails: familyDetailsFormSchema,
    })
    .superRefine(applyRdValidation);

  const deactivateStudentFormSchema = z.object({
    status: z.enum(['Alumni', 'Discontinued']),
    statusReason: z.string().trim().min(1, msg.reasonRequired).max(500),
  });

  return { createStudentFormSchema, updateStudentFormSchema, deactivateStudentFormSchema };
}

const defaultSchemas = buildStudentFormSchemas();
export const createStudentFormSchema = defaultSchemas.createStudentFormSchema;
export const updateStudentFormSchema = defaultSchemas.updateStudentFormSchema;
export const deactivateStudentFormSchema = defaultSchemas.deactivateStudentFormSchema;

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

function mapEmergencyContacts(contacts: CreateStudentFormValues['emergencyContacts']) {
  return contacts.map((contact) => ({
    contactName: contact.contactName,
    relationship: contact.relationship,
    phone: normalizeIndianPhone(contact.phone),
  }));
}

type LookupIds = {
  bloodGroupId?: string;
  admissionCategoryId?: string;
  motherTongueId?: string;
  religionId?: string;
  socialCategoryId?: string;
  academicYearId: string;
  standardId: string;
  sectionId?: string;
};

export function buildCreateStudentPayload(
  values: CreateStudentFormValues,
  lookupIds: LookupIds,
) {
  return {
    admissionNumber: values.admissionNumber.trim(),
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    dob: values.dob,
    gender: values.gender,
    admissionDate: values.admissionDate,
    bloodGroupId: lookupIds.bloodGroupId ? Number(lookupIds.bloodGroupId) : undefined,
    admissionCategoryId: lookupIds.admissionCategoryId
      ? Number(lookupIds.admissionCategoryId)
      : undefined,
    motherTongueId: lookupIds.motherTongueId ? Number(lookupIds.motherTongueId) : undefined,
    aadhaarNumber: values.aadhaarNumber?.trim() || undefined,
    satsId: values.satsId?.trim() || undefined,
    satsTransferStatus: values.satsTransferStatus,
    academicPlacement: {
      academicYearId: Number(lookupIds.academicYearId),
      standardId: Number(lookupIds.standardId),
      sectionId: lookupIds.sectionId ? Number(lookupIds.sectionId) : undefined,
      rollNumber: values.academicPlacement.rollNumber,
      previousSchool: values.academicPlacement.previousSchool || undefined,
      previousSchoolAddress: values.academicPlacement.previousSchoolAddress || undefined,
      lastClassStudied: values.academicPlacement.lastClassStudied || undefined,
      enrolledAt: values.admissionDate,
    },
    emergencyContacts: mapEmergencyContacts(values.emergencyContacts),
    socialDetails: values.socialDetails
      ? {
          religionId: lookupIds.religionId ? Number(lookupIds.religionId) : undefined,
          socialCategoryId: lookupIds.socialCategoryId
            ? Number(lookupIds.socialCategoryId)
            : undefined,
          caste: values.socialDetails.caste || undefined,
          subCaste: values.socialDetails.subCaste || undefined,
          rdNumber: values.socialDetails.rdNumber || undefined,
          rdNumberSecondary: values.socialDetails.rdNumberSecondary || undefined,
        }
      : undefined,
    familyDetails: mapFamilyDetails(values.familyDetails),
  };
}

export function buildUpdateStudentPayload(
  values: UpdateStudentFormValues,
  lookupIds: LookupIds,
  includeFamily: boolean,
) {
  const payload: Record<string, unknown> = {
    firstName: values.firstName,
    lastName: values.lastName || null,
    dob: values.dob,
    gender: values.gender,
    admissionDate: values.admissionDate,
    bloodGroupId: lookupIds.bloodGroupId ? Number(lookupIds.bloodGroupId) : null,
    admissionCategoryId: lookupIds.admissionCategoryId
      ? Number(lookupIds.admissionCategoryId)
      : null,
    motherTongueId: lookupIds.motherTongueId ? Number(lookupIds.motherTongueId) : null,
    aadhaarNumber: values.aadhaarNumber?.trim() || null,
    satsId: values.satsId?.trim() || null,
    satsTransferStatus: values.satsTransferStatus,
    academicPlacement: {
      academicYearId: Number(lookupIds.academicYearId),
      standardId: Number(lookupIds.standardId),
      sectionId: lookupIds.sectionId ? Number(lookupIds.sectionId) : null,
      rollNumber: values.academicPlacement.rollNumber,
      previousSchool: values.academicPlacement.previousSchool || null,
      previousSchoolAddress: values.academicPlacement.previousSchoolAddress || null,
      lastClassStudied: values.academicPlacement.lastClassStudied || null,
      enrolledAt: values.admissionDate,
    },
    emergencyContacts: mapEmergencyContacts(values.emergencyContacts),
  };

  if (includeFamily) {
    payload.familyDetails = mapFamilyDetails(values.familyDetails);
    if (values.socialDetails) {
      payload.socialDetails = {
        religionId: lookupIds.religionId ? Number(lookupIds.religionId) : null,
        socialCategoryId: lookupIds.socialCategoryId
          ? Number(lookupIds.socialCategoryId)
          : null,
        caste: values.socialDetails.caste || null,
        subCaste: values.socialDetails.subCaste || null,
        rdNumber: values.socialDetails.rdNumber || null,
        rdNumberSecondary: values.socialDetails.rdNumberSecondary || null,
      };
    }
  }

  return payload;
}

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

export const defaultEmergencyContact: CreateStudentFormValues['emergencyContacts'][number] = {
  contactName: '',
  relationship: '',
  phone: '',
};

export const defaultAcademicPlacement: CreateStudentFormValues['academicPlacement'] = {
  rollNumber: '',
  previousSchool: '',
  previousSchoolAddress: '',
  lastClassStudied: '',
};

export const defaultSocialDetails: NonNullable<CreateStudentFormValues['socialDetails']> = {
  caste: '',
  subCaste: '',
  rdNumber: '',
  rdNumberSecondary: '',
};
