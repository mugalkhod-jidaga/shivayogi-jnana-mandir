import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { permissionService } from '../../auth/services/permission.service';
import { exportService } from '../services/export.service';

function requireAuthContext(req: Request): { profileId: string; tenantId: number } {
  if (!req.profileId || req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { profileId: req.profileId, tenantId: req.tenantId };
}

function paramId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') throw new AppError(400, 'Invalid id');
  return id;
}

export const exportController = {
  async studentsPdf(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await permissionService.getUserPermissions(profileId);
    await exportService.studentListPdf(tenantId, req.query, profileId, permissions, res);
  },

  async studentDetailPdf(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await permissionService.getUserPermissions(profileId);
    await exportService.studentDetailPdf(tenantId, paramId(req), profileId, permissions, res);
  },

  async remarksPdf(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    await exportService.remarksListPdf(tenantId, req.query, profileId, res);
  },
};
