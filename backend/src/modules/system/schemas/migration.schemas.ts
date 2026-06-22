import { z } from 'zod';
import { dobInputSchema, phoneSchema } from '../../../utils/validators';

export const migrationCsvRowSchema = z.object({
  admission_number: z.string().min(1).max(100),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  dob: dobInputSchema,
  gender: z.string().max(20).optional(),
  blood_group: z.string().min(1).max(5),
  admission_category: z.string().min(1).max(100),
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
