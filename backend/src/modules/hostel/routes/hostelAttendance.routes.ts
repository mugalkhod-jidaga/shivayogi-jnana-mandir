import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { hostelAttendanceController } from '../controllers/hostelAttendance.controller';
import {
  bulkAttendanceRecordSchema,
  createSessionSchema,
  ensureSessionSchema,
  updateSessionSchema,
} from '../schemas/hostelAttendance.schemas';

export const hostelAttendanceRoutes = Router();

hostelAttendanceRoutes.get(
  '/sessions',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelAttendanceController.listSessions),
);

hostelAttendanceRoutes.post(
  '/sessions',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:record'),
  validateZod(createSessionSchema),
  asyncHandler(hostelAttendanceController.createSession),
);

hostelAttendanceRoutes.post(
  '/sessions/ensure',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:record'),
  validateZod(ensureSessionSchema),
  asyncHandler(hostelAttendanceController.ensureSession),
);

hostelAttendanceRoutes.get(
  '/daily-board',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelAttendanceController.getDailyBoard),
);

hostelAttendanceRoutes.get(
  '/sessions/:id',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelAttendanceController.getSession),
);

hostelAttendanceRoutes.patch(
  '/sessions/:id',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:record'),
  validateZod(updateSessionSchema),
  asyncHandler(hostelAttendanceController.updateSession),
);

hostelAttendanceRoutes.get(
  '/sessions/:id/records',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelAttendanceController.listRecords),
);

hostelAttendanceRoutes.get(
  '/sessions/:id/roster',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelAttendanceController.getSessionRoster),
);

hostelAttendanceRoutes.post(
  '/sessions/:id/records',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:record'),
  validateZod(bulkAttendanceRecordSchema),
  asyncHandler(hostelAttendanceController.upsertRecords),
);
