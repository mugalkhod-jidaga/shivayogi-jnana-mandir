import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { asyncHandler } from '../../../utils/asyncHandler';
import { exportController } from '../controllers/export.controller';

export const exportRoutes = Router();

exportRoutes.get(
  '/pdf/students',
  extractTenantMiddleware,
  requirePermission('exports:pdf'),
  asyncHandler(exportController.studentsPdf),
);

exportRoutes.get(
  '/pdf/students/:id',
  extractTenantMiddleware,
  requirePermission('exports:pdf'),
  asyncHandler(exportController.studentDetailPdf),
);

exportRoutes.get(
  '/pdf/remarks',
  extractTenantMiddleware,
  requirePermission('exports:pdf'),
  asyncHandler(exportController.remarksPdf),
);
