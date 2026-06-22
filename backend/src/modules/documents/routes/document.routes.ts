import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { documentController } from '../controllers/document.controller';
import { documentVerifySchema } from '../schemas/document.schemas';

export const documentRoutes = Router();

documentRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('documents:view'),
  asyncHandler(documentController.list),
);

documentRoutes.get(
  '/:id/download',
  extractTenantMiddleware,
  requirePermission('documents:download'),
  asyncHandler(documentController.download),
);

documentRoutes.patch(
  '/:id/verify',
  extractTenantMiddleware,
  requirePermission('documents:verify'),
  validateZod(documentVerifySchema),
  asyncHandler(documentController.verify),
);
