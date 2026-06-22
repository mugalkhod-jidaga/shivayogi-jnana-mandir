import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { asyncHandler } from '../../../utils/asyncHandler';
import { roleController } from '../controllers/user.controller';

export const roleRoutes = Router();

roleRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  asyncHandler(roleController.list),
);
