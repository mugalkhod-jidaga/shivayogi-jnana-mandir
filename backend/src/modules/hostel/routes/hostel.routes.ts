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
  updateBlockSchema,
  updateRoomSchema,
} from '../schemas/hostel.schemas';

export const hostelRoutes = Router();

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
