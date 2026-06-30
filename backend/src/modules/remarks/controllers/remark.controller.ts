import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { permissionService } from '../../auth/services/permission.service';
import type { CreateRemarkInput, UpdateRemarkInput } from '../schemas/remark.schemas';
import { remarkListQuerySchema, remarkStatsQuerySchema } from '../schemas/remark.schemas';
import { remarkService } from '../services/remark.service';

function requireAuthContext(req: Request): { profileId: string; tenantId: number } {
  if (!req.profileId || req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { profileId: req.profileId, tenantId: req.tenantId };
}

function paramId(req: Request, key = 'id'): string {
  const id = req.params[key];
  if (typeof id !== 'string') throw new AppError(400, 'Invalid id');
  return id;
}

export const remarkController = {
  async list(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const query = remarkListQuerySchema.parse(req.query);
    const { data, meta } = await remarkService.list(tenantId, query, profileId);
    res.json({ success: true, data, meta });
  },

  async stats(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const { days } = remarkStatsQuerySchema.parse(req.query);
    const data = await remarkService.stats(tenantId, days, profileId);
    res.json({ success: true, data });
  },

  async listForStudent(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const query = remarkListQuerySchema.parse(req.query);
    const { data, meta } = await remarkService.listForStudent(tenantId, studentId, query, profileId);
    res.json({ success: true, data, meta });
  },

  async create(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const data = await remarkService.create(
      tenantId,
      studentId,
      req.body as CreateRemarkInput,
      profileId,
    );
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await permissionService.getUserPermissions(profileId);
    const data = await remarkService.update(
      paramId(req),
      tenantId,
      req.body as UpdateRemarkInput,
      profileId,
      permissions,
    );
    res.json({ success: true, data });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await permissionService.getUserPermissions(profileId);
    await remarkService.softDelete(paramId(req), tenantId, profileId, permissions);
    res.json({ success: true, data: { id: paramId(req) } });
  },
};
