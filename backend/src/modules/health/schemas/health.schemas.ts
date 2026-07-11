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
  attachmentKindId: z.coerce.number().int().positive(),
});

const ALLOWED_ATTACHMENT_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export function isAllowedHealthAttachmentMime(mimeType: string | undefined): boolean {
  if (!mimeType) return false;
  return (ALLOWED_ATTACHMENT_MIMES as readonly string[]).includes(mimeType.toLowerCase());
}

export const createHealthVisitSchema = z.object({
  studentId: z.string().uuid(),
  visitDate: dateInputSchema,
  issueType: z.string().trim().min(1).max(500),
  symptoms: z.string().trim().max(5000).optional().default(''),
  severityId: z.coerce.number().int().positive(),
  healthStatus: z.enum(['healthy', 'sick', 'recovering']),
  treatedBy: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(5000).optional(),
  temperature: z.string().trim().max(20).optional(),
  bloodPressure: z.string().trim().max(20).optional(),
  oxygenLevel: z.string().trim().max(20).optional(),
  medicines: z.array(medicineRowSchema).min(1).max(10),
  attachments: z.array(visitAttachmentSchema).max(8).optional(),
});

export const updateStudentHealthStatusSchema = z.object({
  healthStatus: z.enum(['healthy', 'sick', 'recovering']),
});

const isoDateQuerySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const healthVisitListQuerySchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  severityId: z.coerce.number().int().positive().optional(),
  standardId: z.coerce.number().int().positive().optional(),
  from: isoDateQuerySchema.optional(),
  to: isoDateQuerySchema.optional(),
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

/** Omit or empty = all time; otherwise last N days for visit analytics. */
export const healthReportsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(3650).optional(),
});

export const attachmentPresignSchema = z.object({
  studentId: z.string().uuid(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100).optional(),
});

export type CreateHealthVisitInput = z.infer<typeof createHealthVisitSchema>;
export type UpdateStudentHealthStatusInput = z.infer<typeof updateStudentHealthStatusSchema>;
export type MedicineRowInput = z.infer<typeof medicineRowSchema>;
export type VisitAttachmentInput = z.infer<typeof visitAttachmentSchema>;
export type HealthVisitListQuery = z.infer<typeof healthVisitListQuerySchema>;
export type RecentVisitsQuery = z.infer<typeof recentVisitsQuerySchema>;
export type MedicineCatalogSuggestQuery = z.infer<typeof medicineCatalogSuggestQuerySchema>;
export type StaffSearchQuery = z.infer<typeof staffSearchQuerySchema>;
export type HealthReportsQuery = z.infer<typeof healthReportsQuerySchema>;
export type AttachmentPresignInput = z.infer<typeof attachmentPresignSchema>;
export type StudentHealthStatus = UpdateStudentHealthStatusInput['healthStatus'];
