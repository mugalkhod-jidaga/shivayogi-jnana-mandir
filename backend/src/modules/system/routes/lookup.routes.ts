import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { lookupController } from '../controllers/lookup.controller';
import { createLookupValueSchema, updateLookupValueSchema } from '../schemas/lookup.schemas';

export const lookupRoutes = Router();

lookupRoutes.get(
  '/blood-groups',
  extractTenantMiddleware,
  asyncHandler(lookupController.listBloodGroups),
);

lookupRoutes.get(
  '/admission-categories',
  extractTenantMiddleware,
  asyncHandler(lookupController.listAdmissionCategories),
);

lookupRoutes.post(
  '/admission-categories',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(createLookupValueSchema),
  asyncHandler(lookupController.createAdmissionCategory),
);

lookupRoutes.patch(
  '/admission-categories/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(updateLookupValueSchema),
  asyncHandler(lookupController.updateAdmissionCategory),
);

lookupRoutes.get(
  '/document-types',
  extractTenantMiddleware,
  asyncHandler(lookupController.listDocumentTypes),
);

lookupRoutes.post(
  '/document-types',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(createLookupValueSchema),
  asyncHandler(lookupController.createDocumentType),
);

lookupRoutes.patch(
  '/document-types/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(updateLookupValueSchema),
  asyncHandler(lookupController.updateDocumentType),
);
