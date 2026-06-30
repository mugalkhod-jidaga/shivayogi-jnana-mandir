import { z } from 'zod';
import { dateInputSchema, paginationSchema } from '../../../utils/validators';

export const createMedicalRecordSchema = z.object({
  recordTypeId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(3).max(5000),
  recordedOn: dateInputSchema,
  isOngoing: z.boolean().optional(),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const medicalListQuerySchema = paginationSchema.extend({
  typeId: z.coerce.number().int().positive().optional(),
  studentId: z.string().uuid().optional(),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
export type MedicalListQuery = z.infer<typeof medicalListQuerySchema>;
