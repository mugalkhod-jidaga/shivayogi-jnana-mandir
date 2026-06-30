import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { medicalController } from '../controllers/medical.controller';
import { createMedicalRecordSchema, updateMedicalRecordSchema } from '../schemas/medical.schemas';

export const medicalRoutes = Router();

medicalRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(medicalController.list),
);

medicalRoutes.patch(
  '/:id',
  extractTenantMiddleware,
  requirePermission('medical:edit'),
  validateZod(updateMedicalRecordSchema),
  asyncHandler(medicalController.update),
);

medicalRoutes.delete(
  '/:id',
  extractTenantMiddleware,
  requirePermission('medical:edit'),
  asyncHandler(medicalController.remove),
);

export const studentMedicalRoutes = Router({ mergeParams: true });

studentMedicalRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(medicalController.listForStudent),
);

studentMedicalRoutes.post(
  '/',
  extractTenantMiddleware,
  requirePermission('medical:create'),
  validateZod(createMedicalRecordSchema),
  asyncHandler(medicalController.create),
);
