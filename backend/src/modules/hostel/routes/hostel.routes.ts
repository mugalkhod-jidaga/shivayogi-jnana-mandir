import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { requirePermission } from '../../../middlewares/requirePermission';
import { validateZod } from '../../../middlewares/validateZod';
import { asyncHandler } from '../../../utils/asyncHandler';
import { hostelController } from '../controllers/hostel.controller';
import {
  createAllocationSchema,
  createBlockSchema,
  createRoomSchema,
  endAllocationSchema,
  transferAllocationSchema,
  updateBlockSchema,
  updateRoomSchema,
} from '../schemas/hostel.schemas';

export const hostelRoutes = Router();

hostelRoutes.get(
  '/overview',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.getOverview),
);

hostelRoutes.get(
  '/reports/daily',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelController.getDailyReport),
);

hostelRoutes.get(
  '/reports/occupancy',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.getOccupancyReport),
);

hostelRoutes.get(
  '/reports/attendance-trend',
  extractTenantMiddleware,
  requirePermission('hostel_attendance:read'),
  asyncHandler(hostelController.getAttendanceTrend),
);

hostelRoutes.get(
  '/beds/vacant',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.listVacantBeds),
);

hostelRoutes.get(
  '/rooms/:roomId/beds',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.listBedsByRoom),
);

hostelRoutes.get(
  '/blocks',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.listBlocks),
);

hostelRoutes.post(
  '/blocks',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(createBlockSchema),
  asyncHandler(hostelController.createBlock),
);

hostelRoutes.patch(
  '/blocks/:id',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(updateBlockSchema),
  asyncHandler(hostelController.updateBlock),
);

hostelRoutes.delete(
  '/blocks/:id',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  asyncHandler(hostelController.deleteBlock),
);

hostelRoutes.get(
  '/blocks/:blockId/rooms',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.listRooms),
);

hostelRoutes.post(
  '/blocks/:blockId/rooms',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(createRoomSchema),
  asyncHandler(hostelController.createRoom),
);

hostelRoutes.patch(
  '/rooms/:id',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(updateRoomSchema),
  asyncHandler(hostelController.updateRoom),
);

hostelRoutes.delete(
  '/rooms/:id',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  asyncHandler(hostelController.deleteRoom),
);

hostelRoutes.get(
  '/allocations',
  extractTenantMiddleware,
  requirePermission('hostel:read'),
  asyncHandler(hostelController.listAllocations),
);

hostelRoutes.post(
  '/allocations',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(createAllocationSchema),
  asyncHandler(hostelController.createAllocation),
);

hostelRoutes.post(
  '/allocations/transfer',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(transferAllocationSchema),
  asyncHandler(hostelController.transferAllocation),
);

hostelRoutes.patch(
  '/allocations/:id/end',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  validateZod(endAllocationSchema),
  asyncHandler(hostelController.endAllocation),
);

hostelRoutes.delete(
  '/allocations/:id',
  extractTenantMiddleware,
  requirePermission('hostel:manage'),
  asyncHandler(hostelController.deleteAllocation),
);
