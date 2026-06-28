import { z } from 'zod';
import { aadhaarSchema, dateInputSchema, dobInputSchema, phoneSchema } from '../../../utils/validators';

export const migrationCsvRowSchema = z.object({
  admission_number: z.string().min(1).max(100),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  dob: dobInputSchema,
  gender: z.string().max(20).optional(),
  blood_group: z.string().min(1).max(5),
  admission_category: z.string().min(1).max(100),
  admission_date: dateInputSchema,
  mother_tongue: z.string().max(100).optional(),
  aadhaar_number: aadhaarSchema.optional(),
  academic_year: z.string().min(1).max(20),
  standard: z.string().min(1).max(100),
  section: z.string().max(50).optional(),
  roll_number: z.string().min(1).max(20),
  previous_school: z.string().max(255).optional(),
  last_class_studied: z.string().max(100).optional(),
  emergency_contact_name: z.string().min(1).max(100),
  emergency_contact_relationship: z.string().min(1).max(100),
  emergency_contact_phone: z.string().min(1),
  father_name: z.string().max(100).optional(),
  mother_name: z.string().max(100).optional(),
  primary_contact: z.string().min(1),
  village_town: z.string().min(1).max(150),
  taluk_mandal: z.string().min(1).max(150),
  district: z.string().min(1).max(150),
  pincode: z.string().min(6).max(10),
});

export const migrationCommitRowSchema = z.object({
  admission_number: z.string().min(1).max(100),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  dob: dobInputSchema,
  gender: z.string().max(20).optional(),
  blood_group_id: z.number().int().positive(),
  admission_category_id: z.number().int().positive(),
  admission_date: dateInputSchema,
  mother_tongue_id: z.number().int().positive().optional(),
  aadhaar_number: aadhaarSchema.optional(),
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
  pincode: z.string().min(6).max(10),
});

export const migrationCommitSchema = z.object({
  students: z.array(migrationCommitRowSchema).min(1).max(500),
});

export type MigrationCommitInput = z.infer<typeof migrationCommitSchema>;
export type MigrationCommitRow = z.infer<typeof migrationCommitRowSchema>;
