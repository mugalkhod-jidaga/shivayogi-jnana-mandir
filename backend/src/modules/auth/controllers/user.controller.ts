import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { paginationSchema } from '../../../utils/validators';
import { roleService, userService } from '../services/user.service';
import type { CreateStaffInput, UpdateStaffInput } from '../schemas/user.schemas';

function requireAuthContext(req: Request): { profileId: string; tenantId: number } {
  if (!req.profileId || req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { profileId: req.profileId, tenantId: req.tenantId };
}

function paramId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') {
    throw new AppError(400, 'Invalid user id');
  }
  return id;
}

export const userController = {
  async getMe(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await userService.getMe(profileId, tenantId);
    res.json({ success: true, data });
  },

  async completePasswordReset(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await userService.completePasswordReset(profileId, tenantId);
    res.json({ success: true, data });
  },

  async list(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const { page, limit, search } = paginationSchema.parse(req.query);
    const { data, meta } = await userService.list(tenantId, page, limit, search);
    res.json({ success: true, data, meta });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await userService.getById(paramId(req), tenantId);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response): Promise<void> {
    const { tenantId, profileId } = requireAuthContext(req);
    const { staff, tempPassword } = await userService.createStaff(
      tenantId,
      req.body as CreateStaffInput,
      profileId,
    );
    res.status(201).json({
      success: true,
      data: staff,
      meta: { tempPassword },
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { tenantId, profileId } = requireAuthContext(req);
    const data = await userService.updateStaff(
      paramId(req),
      tenantId,
      req.body as UpdateStaffInput,
      profileId,
    );
    res.json({ success: true, data });
  },

  async deactivate(req: Request, res: Response): Promise<void> {
    const { tenantId, profileId } = requireAuthContext(req);
    const data = await userService.deactivate(paramId(req), tenantId, profileId);
    res.json({ success: true, data });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { tenantId, profileId } = requireAuthContext(req);
    const { staff, tempPassword } = await userService.resetPassword(
      paramId(req),
      tenantId,
      profileId,
    );
    res.json({
      success: true,
      data: staff,
      meta: { tempPassword },
    });
  },
};

export const roleController = {
  async list(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await roleService.list(tenantId);
    res.json({ success: true, data });
  },
};
