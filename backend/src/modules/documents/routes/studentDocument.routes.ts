import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { uploadLimiter } from '../../../middlewares/rateLimiters';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { studentDocumentController } from '../controllers/document.controller';
import { documentConfirmSchema, documentPresignSchema } from '../schemas/document.schemas';

export const studentDocumentRoutes = Router({ mergeParams: true });

studentDocumentRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('documents:view'),
  asyncHandler(studentDocumentController.list),
);

studentDocumentRoutes.post(
  '/presign',
  extractTenantMiddleware,
  requirePermission('documents:upload'),
  uploadLimiter,
  validateZod(documentPresignSchema),
  asyncHandler(studentDocumentController.presign),
);

studentDocumentRoutes.post(
  '/confirm',
  extractTenantMiddleware,
  requirePermission('documents:upload'),
  validateZod(documentConfirmSchema),
  asyncHandler(studentDocumentController.confirm),
);
