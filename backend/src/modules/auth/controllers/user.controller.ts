import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { userService } from '../services/user.service';

export const userController = {
  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.profileId || req.tenantId === undefined) {
      throw new AppError(401, 'Not authenticated');
    }

    const data = await userService.getMe(req.profileId, req.tenantId);
    res.json({ success: true, data });
  },
};
