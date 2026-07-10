import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { healthController } from '../controllers/health.controller';
import {
  attachmentPresignSchema,
  createHealthVisitSchema,
  updateStudentHealthStatusSchema,
} from '../schemas/health.schemas';

export const healthRoutes = Router();

healthRoutes.get(
  '/reports',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.getReports),
);

healthRoutes.get(
  '/dashboard/stats',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.getDashboardStats),
);

healthRoutes.get(
  '/medicine-catalog/suggest',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.suggestMedicines),
);

healthRoutes.get(
  '/staff/search',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.searchStaff),
);

healthRoutes.post(
  '/attachments/presign',
  extractTenantMiddleware,
  requirePermission('medical:create'),
  validateZod(attachmentPresignSchema),
  asyncHandler(healthController.presignAttachment),
);

healthRoutes.get(
  '/attachments/:id/download',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.downloadAttachment),
);

healthRoutes.get(
  '/visits',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.list),
);

healthRoutes.get(
  '/visits/recent',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.listRecent),
);

healthRoutes.get(
  '/visits/:id',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.getById),
);

healthRoutes.post(
  '/visits',
  extractTenantMiddleware,
  requirePermission('medical:create'),
  validateZod(createHealthVisitSchema),
  asyncHandler(healthController.createVisit),
);

healthRoutes.get(
  '/students/:studentId/visits',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.listForStudent),
);

healthRoutes.get(
  '/students/:studentId/visit-summary',
  extractTenantMiddleware,
  requirePermission('medical:read'),
  asyncHandler(healthController.getStudentSummary),
);

healthRoutes.patch(
  '/students/:studentId/health-status',
  extractTenantMiddleware,
  requirePermission('medical:create'),
  validateZod(updateStudentHealthStatusSchema),
  asyncHandler(healthController.updateStudentHealthStatus),
);
