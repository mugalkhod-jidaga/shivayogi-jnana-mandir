import { z } from 'zod';
import { aadhaarSchema, dateInputSchema, dobInputSchema, phoneSchema, satsIdSchema } from '../../../utils/validators';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

const optionalCsvString = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const migrationCsvRowSchema = z.object({
  admission_number: z.string().min(1).max(100),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  dob: dobInputSchema,
  gender: z.string().max(20).optional(),
  blood_group: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(5).optional()),
  admission_category: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional()),
  admission_date: dateInputSchema,
  mother_tongue: optionalCsvString(100),
  aadhaar_number: z.preprocess(emptyToUndefined, aadhaarSchema.optional()),
  sats_id: z.preprocess(emptyToUndefined, satsIdSchema.optional()),
  academic_year: z.string().min(1).max(20),
  standard: z.string().min(1).max(100),
  section: optionalCsvString(50),
  roll_number: z.string().min(1).max(20),
  previous_school: optionalCsvString(255),
  last_class_studied: optionalCsvString(100),
  emergency_contact_name: z.string().min(1).max(100),
  emergency_contact_relationship: z.string().min(1).max(100),
  emergency_contact_phone: z.string().min(1),
  father_name: optionalCsvString(100),
  mother_name: optionalCsvString(100),
  primary_contact: z.string().min(1),
  village_town: z.string().min(1).max(150),
  taluk_mandal: z.string().min(1).max(150),
  district: z.string().min(1).max(150),
  state: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),
  pincode: z.string().min(6).max(10),
  caste: optionalCsvString(100),
  social_category: optionalCsvString(50),
  rd_number: optionalCsvString(50),
  rd_number_secondary: optionalCsvString(50),
});

export const migrationCommitRowSchema = z.object({
  admission_number: z.string().min(1).max(100),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  dob: dobInputSchema,
  gender: z.string().max(20).optional(),
  blood_group_id: z.number().int().positive().optional(),
  admission_category_id: z.number().int().positive().optional(),
  admission_date: dateInputSchema,
  mother_tongue_id: z.number().int().positive().optional(),
  aadhaar_number: aadhaarSchema.optional(),
  sats_id: satsIdSchema.optional(),
  academic_year_id: z.number().int().positive(),
  standard_id: z.number().int().positive(),
  section_id: z.number().int().positive().optional(),
  roll_number: z.string().min(1).max(20),
  previous_school: z.string().max(255).optional(),
  last_class_studied: z.string().max(100).optional(),
  emergency_contact_name: z.string().min(1).max(100),
  emergency_contact_relationship: z.string().min(1).max(100),
  emergency_contact_phone: phoneSchema,
  father_name: z.string().max(100).optional(),
  mother_name: z.string().max(100).optional(),
  parent_status: z.string().max(50).optional(),
  primary_contact: phoneSchema,
  village_town: z.string().min(1).max(150),
  taluk_mandal: z.string().min(1).max(150),
  district: z.string().min(1).max(150),
  state: z.string().max(150).optional(),
  pincode: z.string().min(6).max(10),
  social_category_id: z.number().int().positive().optional(),
  caste: z.string().max(100).optional(),
  rd_number: z.string().max(50).optional(),
  rd_number_secondary: z.string().max(50).optional(),
});

export const migrationCommitSchema = z.object({
  students: z.array(migrationCommitRowSchema).min(1).max(500),
});

export type MigrationCommitInput = z.infer<typeof migrationCommitSchema>;
export type MigrationCommitRow = z.infer<typeof migrationCommitRowSchema>;
