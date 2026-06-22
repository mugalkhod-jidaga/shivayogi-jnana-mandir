import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { asyncHandler } from '../../../utils/asyncHandler';
import { auditLogController, dashboardController } from '../controllers/dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/summary',
  extractTenantMiddleware,
  requirePermission('dashboard:view'),
  asyncHandler(dashboardController.summary),
);

dashboardRoutes.get(
  '/compliance-report',
  extractTenantMiddleware,
  requirePermission('dashboard:view'),
  asyncHandler(dashboardController.complianceReport),
);

export const auditLogRoutes = Router();

auditLogRoutes.get(
  '/',
  extractTenantMiddleware,
  requirePermission('audit_logs:view'),
  asyncHandler(auditLogController.list),
);
