import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { permissionService } from '../../auth/services/permission.service';
import type {
  CreateStudentInput,
  DeactivateStudentInput,
  UpdateStudentInput,
} from '../schemas/student.schemas';
import { studentListQuerySchema } from '../schemas/student.schemas';
import { studentService } from '../services/student.service';

function requireAuthContext(req: Request): { profileId: string; tenantId: number } {
  if (!req.profileId || req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { profileId: req.profileId, tenantId: req.tenantId };
}

function paramId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') throw new AppError(400, 'Invalid student id');
  return id;
}

async function getPermissions(profileId: string): Promise<string[]> {
  return permissionService.getUserPermissions(profileId);
}

export const studentController = {
  async getNextAdmissionNumber(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await studentService.getNextAdmissionNumber(tenantId);
    res.json({ success: true, data });
  },

  async list(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const query = studentListQuerySchema.parse(req.query);
    const permissions = await getPermissions(profileId);
    const { data, meta } = await studentService.list(tenantId, query, profileId, permissions);
    res.json({ success: true, data, meta });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await studentService.getById(paramId(req), tenantId, profileId, permissions);
    res.json({ success: true, data });
  },

  async create(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await studentService.create(
      tenantId,
      req.body as CreateStudentInput,
      profileId,
      permissions,
    );
    res.status(201).json({ success: true, data });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await studentService.update(
      paramId(req),
      tenantId,
      req.body as UpdateStudentInput,
      profileId,
      permissions,
    );
    res.json({ success: true, data });
  },

  async deactivate(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await studentService.deactivate(
      paramId(req),
      tenantId,
      req.body as DeactivateStudentInput,
      profileId,
      permissions,
    );
    res.json({ success: true, data });
  },

  async presignAvatar(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const { filename, contentType } = req.body as { filename: string; contentType?: string };
    const data = await studentService.presignAvatar(paramId(req), tenantId, filename, contentType);
    res.json({ success: true, data });
  },

  async confirmAvatar(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const { key } = req.body as { key: string };
    const data = await studentService.confirmAvatar(paramId(req), tenantId, key, profileId, permissions);
    res.json({ success: true, data });
  },

  async getAvatarDownload(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await studentService.getAvatarDownloadUrl(paramId(req), tenantId);
    res.json({ success: true, data });
  },
};
