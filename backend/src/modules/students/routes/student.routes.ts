import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { uploadLimiter } from '../../../middlewares/rateLimiters';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { studentController } from '../controllers/student.controller';
import {
  avatarConfirmSchema,
  avatarPresignSchema,
  createStudentSchema,
  deactivateStudentSchema,
  updateStudentSchema,
} from '../schemas/student.schemas';

export const studentRoutes = Router();

studentRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('students:read'),
  asyncHandler(studentController.list),
);

studentRoutes.post(
  '/',
  extractTenantMiddleware,
  requirePermission('students:create'),
  validateZod(createStudentSchema),
  asyncHandler(studentController.create),
);

studentRoutes.get(
  '/:id',
  extractTenantMiddleware,
  requirePermission('students:read'),
  asyncHandler(studentController.getById),
);

studentRoutes.patch(
  '/:id/deactivate',
  extractTenantMiddleware,
  requirePermission('students:soft_delete'),
  validateZod(deactivateStudentSchema),
  asyncHandler(studentController.deactivate),
);

studentRoutes.post(
  '/:id/avatar/presign',
  extractTenantMiddleware,
  requirePermission('students:edit'),
  uploadLimiter,
  validateZod(avatarPresignSchema),
  asyncHandler(studentController.presignAvatar),
);

studentRoutes.post(
  '/:id/avatar/confirm',
  extractTenantMiddleware,
  requirePermission('students:edit'),
  validateZod(avatarConfirmSchema),
  asyncHandler(studentController.confirmAvatar),
);

studentRoutes.get(
  '/:id/avatar/download',
  extractTenantMiddleware,
  requirePermission('students:read'),
  asyncHandler(studentController.getAvatarDownload),
);

studentRoutes.patch(
  '/:id',
  extractTenantMiddleware,
  requirePermission('students:edit'),
  validateZod(updateStudentSchema),
  asyncHandler(studentController.update),
);
