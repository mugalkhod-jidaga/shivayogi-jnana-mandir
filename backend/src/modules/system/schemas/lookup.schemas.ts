import { z } from 'zod';

export const createLookupValueSchema = z.object({
  value: z.string().trim().min(1).max(100),
  labelKn: z.string().trim().max(100).optional(),
});

export const updateLookupValueSchema = z
  .object({
    value: z.string().trim().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    labelKn: z.string().trim().max(100).optional().nullable(),
  })
  .refine(
    (data) =>
      data.value !== undefined || data.isActive !== undefined || data.labelKn !== undefined,
    { message: 'At least one field must be provided' },
  );

export type CreateLookupValueInput = z.infer<typeof createLookupValueSchema>;
export type UpdateLookupValueInput = z.infer<typeof updateLookupValueSchema>;
export type CreateAcademicStandardInput = z.infer<typeof createAcademicStandardSchema>;
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;

export const createAcademicStandardSchema = z.object({
  value: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().min(0).optional(),
});

export const createAcademicYearSchema = z.object({
  label: z.string().trim().min(1).max(20),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  isCurrent: z.boolean().optional(),
});

export const updateAcademicYearSchema = z
  .object({
    label: z.string().trim().min(1).max(20).optional(),
    startDate: z.string().trim().min(1).optional(),
    endDate: z.string().trim().min(1).optional(),
    isCurrent: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.label !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined ||
      data.isCurrent !== undefined ||
      data.isActive !== undefined,
    { message: 'At least one field must be provided' },
  );
