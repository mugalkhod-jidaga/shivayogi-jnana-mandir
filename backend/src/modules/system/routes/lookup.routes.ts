import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { lookupController } from '../controllers/lookup.controller';
import {
  createAcademicStandardSchema,
  createAcademicYearSchema,
  createLookupValueSchema,
  updateAcademicYearSchema,
  updateLookupValueSchema,
} from '../schemas/lookup.schemas';

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

lookupRoutes.get(
  '/academic-standards',
  extractTenantMiddleware,
  asyncHandler(lookupController.listAcademicStandards),
);

lookupRoutes.post(
  '/academic-standards',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(createAcademicStandardSchema),
  asyncHandler(lookupController.createAcademicStandard),
);

lookupRoutes.patch(
  '/academic-standards/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(updateLookupValueSchema),
  asyncHandler(lookupController.updateAcademicStandard),
);

lookupRoutes.get(
  '/sections',
  extractTenantMiddleware,
  asyncHandler(lookupController.listSections),
);

lookupRoutes.post(
  '/sections',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(createLookupValueSchema),
  asyncHandler(lookupController.createSection),
);

lookupRoutes.patch(
  '/sections/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(updateLookupValueSchema),
  asyncHandler(lookupController.updateSection),
);

lookupRoutes.get(
  '/academic-years',
  extractTenantMiddleware,
  asyncHandler(lookupController.listAcademicYears),
);

lookupRoutes.post(
  '/academic-years',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(createAcademicYearSchema),
  asyncHandler(lookupController.createAcademicYear),
);

lookupRoutes.patch(
  '/academic-years/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(updateAcademicYearSchema),
  asyncHandler(lookupController.updateAcademicYear),
);

lookupRoutes.get(
  '/languages',
  extractTenantMiddleware,
  asyncHandler(lookupController.listLanguages),
);

lookupRoutes.post(
  '/languages',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(createLookupValueSchema),
  asyncHandler(lookupController.createLanguage),
);

lookupRoutes.patch(
  '/languages/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_lookups'),
  validateZod(updateLookupValueSchema),
  asyncHandler(lookupController.updateLanguage),
);
