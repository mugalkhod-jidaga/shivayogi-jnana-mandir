import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { roleController, userController } from '../controllers/user.controller';
import { createStaffSchema, updateStaffSchema } from '../schemas/user.schemas';

export const userRoutes = Router();

userRoutes.get('/me', extractTenantMiddleware, asyncHandler(userController.getMe));

userRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  asyncHandler(userController.list),
);

userRoutes.post(
  '/',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  validateZod(createStaffSchema),
  asyncHandler(userController.create),
);

userRoutes.get(
  '/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  asyncHandler(userController.getById),
);

userRoutes.patch(
  '/:id/deactivate',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  asyncHandler(userController.deactivate),
);

userRoutes.post(
  '/:id/reset-password',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  asyncHandler(userController.resetPassword),
);

userRoutes.patch(
  '/:id',
  extractTenantMiddleware,
  requirePermission('system:manage_roles'),
  validateZod(updateStaffSchema),
  asyncHandler(userController.update),
);
