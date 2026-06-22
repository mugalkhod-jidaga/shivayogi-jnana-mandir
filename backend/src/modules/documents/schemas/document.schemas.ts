import { z } from 'zod';
import { paginationSchema } from '../../../utils/validators';

export const documentListQuerySchema = paginationSchema.extend({
  status: z.string().trim().max(50).optional(),
});

export const documentPresignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  documentTypeId: z.number().int().positive(),
  mimeType: z.string().trim().max(100).optional(),
});

export const documentConfirmSchema = z.object({
  key: z.string().trim().min(1),
  documentTypeId: z.number().int().positive(),
  originalFilename: z.string().trim().max(255).optional(),
  mimeType: z.string().trim().max(100).optional(),
  fileSize: z.number().int().positive().max(26_214_400).optional(), // 25MB
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const documentVerifySchema = z.object({
  status: z.enum(['Verified', 'Rejected', 'Renewal Needed']),
});

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
export type DocumentPresignInput = z.infer<typeof documentPresignSchema>;
export type DocumentConfirmInput = z.infer<typeof documentConfirmSchema>;
export type DocumentVerifyInput = z.infer<typeof documentVerifySchema>;
