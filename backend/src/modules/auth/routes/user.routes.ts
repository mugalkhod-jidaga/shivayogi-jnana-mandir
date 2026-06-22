import { Router } from 'express';
import { extractTenantMiddleware } from '../../../middlewares/extractTenant';
import { asyncHandler } from '../../../utils/asyncHandler';
import { userController } from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.get('/me', extractTenantMiddleware, asyncHandler(userController.getMe));
