import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { permissionService } from '../../auth/services/permission.service';
import {
  documentListQuerySchema,
  type DocumentConfirmInput,
  type DocumentPresignInput,
  type DocumentVerifyInput,
} from '../schemas/document.schemas';
import { documentService } from '../services/document.service';

function requireAuthContext(req: Request): { profileId: string; tenantId: number } {
  if (!req.profileId || req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { profileId: req.profileId, tenantId: req.tenantId };
}

function paramStudentId(req: Request): string {
  const studentId = req.params.studentId;
  if (typeof studentId !== 'string') throw new AppError(400, 'Invalid student id');
  return studentId;
}

function paramDocumentId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') throw new AppError(400, 'Invalid document id');
  return id;
}

async function getPermissions(profileId: string): Promise<string[]> {
  return permissionService.getUserPermissions(profileId);
}

export const studentDocumentController = {
  async list(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await documentService.listByStudent(
      paramStudentId(req),
      tenantId,
      profileId,
      permissions,
    );
    res.json({ success: true, data });
  },

  async presign(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await documentService.presign(
      paramStudentId(req),
      tenantId,
      req.body as DocumentPresignInput,
    );
    res.json({ success: true, data });
  },

  async confirm(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await documentService.confirm(
      paramStudentId(req),
      tenantId,
      req.body as DocumentConfirmInput,
      profileId,
    );
    res.status(201).json({ success: true, data });
  },
};

export const documentController = {
  async list(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const { page, limit, search, status } = documentListQuerySchema.parse(req.query);
    const result = await documentService.listQueue(
      tenantId,
      profileId,
      permissions,
      page,
      limit,
      status,
      search,
    );
    res.json({ success: true, data: result.data, meta: result.meta });
  },

  async download(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await documentService.getDownloadUrl(
      paramDocumentId(req),
      tenantId,
      profileId,
      permissions,
      req.ip,
    );
    res.json({ success: true, data });
  },

  async verify(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const permissions = await getPermissions(profileId);
    const data = await documentService.verify(
      paramDocumentId(req),
      tenantId,
      req.body as DocumentVerifyInput,
      profileId,
      permissions,
    );
    res.json({ success: true, data });
  },
};
