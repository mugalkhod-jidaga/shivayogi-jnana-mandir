import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { remarkController } from '../controllers/remark.controller';
import { createRemarkSchema, updateRemarkSchema } from '../schemas/remark.schemas';

export const remarkRoutes = Router();

remarkRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('remarks:read'),
  asyncHandler(remarkController.list),
);

remarkRoutes.get(
  '/stats',
  extractTenantMiddleware,
  requirePermission('remarks:read'),
  asyncHandler(remarkController.stats),
);

remarkRoutes.patch(
  '/:id',
  extractTenantMiddleware,
  requirePermission('remarks:edit'),
  validateZod(updateRemarkSchema),
  asyncHandler(remarkController.update),
);

remarkRoutes.delete(
  '/:id',
  extractTenantMiddleware,
  requirePermission('remarks:manage'),
  asyncHandler(remarkController.remove),
);

export const studentRemarkRoutes = Router({ mergeParams: true });

studentRemarkRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('remarks:read'),
  asyncHandler(remarkController.listForStudent),
);

studentRemarkRoutes.post(
  '/',
  extractTenantMiddleware,
  requirePermission('remarks:create'),
  validateZod(createRemarkSchema),
  asyncHandler(remarkController.create),
);
