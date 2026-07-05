import { z } from 'zod';
import { dateInputSchema, paginationSchema } from '../../../utils/validators';

const scheduleSchema = z.object({
  morning: z.boolean(),
  noon: z.boolean(),
  evening: z.boolean(),
  night: z.boolean(),
});

export const medicineRowSchema = z.object({
  medicineName: z.string().trim().min(1).max(255),
  doseAmount: z.string().trim().min(1).max(20),
  doseUnitId: z.coerce.number().int().positive(),
  foodTimingId: z.coerce.number().int().positive(),
  schedule: scheduleSchema,
  schedulePresetId: z.coerce.number().int().positive(),
  medicineNotes: z.string().trim().max(1000).optional(),
});

export const visitAttachmentSchema = z.object({
  key: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100).optional(),
  sizeBytes: z.coerce.number().int().nonnegative().optional(),
});

export const createHealthVisitSchema = z.object({
  studentId: z.string().uuid(),
  visitDate: dateInputSchema,
  issueType: z.string().trim().min(1).max(500),
  symptoms: z.string().trim().min(1).max(5000),
  severityId: z.coerce.number().int().positive(),
  treatedBy: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(5000).optional(),
  temperature: z.string().trim().max(20).optional(),
  bloodPressure: z.string().trim().max(20).optional(),
  oxygenLevel: z.string().trim().max(20).optional(),
  medicines: z.array(medicineRowSchema).min(1).max(10),
  attachments: z.array(visitAttachmentSchema).max(4).optional(),
});

export const healthVisitListQuerySchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  severityId: z.coerce.number().int().positive().optional(),
});

export const recentVisitsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(100).optional(),
});

export const medicineCatalogSuggestQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  issueTypes: z.string().trim().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const staffSearchQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const attachmentPresignSchema = z.object({
  studentId: z.string().uuid(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100).optional(),
});

export type CreateHealthVisitInput = z.infer<typeof createHealthVisitSchema>;
export type MedicineRowInput = z.infer<typeof medicineRowSchema>;
export type VisitAttachmentInput = z.infer<typeof visitAttachmentSchema>;
export type HealthVisitListQuery = z.infer<typeof healthVisitListQuerySchema>;
export type RecentVisitsQuery = z.infer<typeof recentVisitsQuerySchema>;
export type MedicineCatalogSuggestQuery = z.infer<typeof medicineCatalogSuggestQuerySchema>;
export type StaffSearchQuery = z.infer<typeof staffSearchQuerySchema>;
export type AttachmentPresignInput = z.infer<typeof attachmentPresignSchema>;
