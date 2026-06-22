import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { migrationUpload } from '../../../middlewares/migrationUpload';
import { requirePermission } from '../../../middlewares/requirePermission';
import { uploadLimiter } from '../../../middlewares/rateLimiters';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { migrationController } from '../controllers/migration.controller';
import { migrationCommitSchema } from '../schemas/migration.schemas';

export const migrationRoutes = Router();

migrationRoutes.post(
  '/parse',
  extractTenantMiddleware,
  requirePermission('students:create'),
  uploadLimiter,
  migrationUpload.single('file'),
  asyncHandler(migrationController.parse),
);

migrationRoutes.post(
  '/commit',
  extractTenantMiddleware,
  requirePermission('students:create'),
  validateZod(migrationCommitSchema),
  asyncHandler(migrationController.commit),
);
