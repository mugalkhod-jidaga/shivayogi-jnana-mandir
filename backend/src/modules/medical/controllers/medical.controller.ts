import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { permissionService } from '../../auth/services/permission.service';
import type { CreateMedicalRecordInput, UpdateMedicalRecordInput } from '../schemas/medical.schemas';
import { medicalListQuerySchema } from '../schemas/medical.schemas';
import { medicalService } from '../services/medical.service';

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

export const medicalController = {
  async list(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const query = medicalListQuerySchema.parse(req.query);
    const { data, meta } = await medicalService.list(tenantId, query, profileId);
    res.json({ success: true, data, meta });
  },

  async listForStudent(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const query = medicalListQuerySchema.parse(req.query);
    const { data, meta } = await medicalService.listForStudent(tenantId, studentId, query, profileId);
    res.json({ success: true, data, meta });
  },

  async create(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const data = await medicalService.create(
      tenantId,
      studentId,
      req.body as CreateMedicalRecordInput,
      profileId,
    );
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await permissionService.getUserPermissions(profileId);
    const data = await medicalService.update(
      paramId(req),
      tenantId,
      req.body as UpdateMedicalRecordInput,
      profileId,
      permissions,
    );
    res.json({ success: true, data });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await permissionService.getUserPermissions(profileId);
    await medicalService.softDelete(paramId(req), tenantId, profileId, permissions);
    res.json({ success: true, data: { id: paramId(req) } });
  },
};
