import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import type {
  AttachmentPresignInput,
  CreateHealthVisitInput,
  UpdateStudentHealthStatusInput,
} from '../schemas/health.schemas';
import {
  attachmentPresignSchema,
  healthVisitListQuerySchema,
  medicineCatalogSuggestQuerySchema,
  recentVisitsQuerySchema,
  staffSearchQuerySchema,
} from '../schemas/health.schemas';
import { healthService } from '../services/health.service';

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

export const healthController = {
  async list(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const query = healthVisitListQuerySchema.parse(req.query);
    const { data, meta } = await healthService.list(tenantId, query, profileId);
    res.json({ success: true, data, meta });
  },

  async listRecent(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const query = recentVisitsQuerySchema.parse(req.query);
    const data = await healthService.listRecent(tenantId, query, profileId);
    res.json({ success: true, data });
  },

  async listForStudent(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const query = healthVisitListQuerySchema.parse(req.query);
    const { data, meta } = await healthService.listForStudent(tenantId, studentId, query, profileId);
    res.json({ success: true, data, meta });
  },

  async getStudentSummary(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const data = await healthService.getStudentSummary(studentId, tenantId, profileId);
    res.json({ success: true, data });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await healthService.getById(paramId(req), tenantId, profileId);
    res.json({ success: true, data });
  },

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await healthService.getDashboardStats(tenantId, profileId);
    res.json({ success: true, data });
  },

  async getReports(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await healthService.getReports(tenantId, profileId);
    res.json({ success: true, data });
  },

  async suggestMedicines(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = medicineCatalogSuggestQuerySchema.parse(req.query);
    const data = await healthService.suggestMedicines(tenantId, query);
    res.json({ success: true, data });
  },

  async searchStaff(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = staffSearchQuerySchema.parse(req.query);
    const data = await healthService.searchStaff(tenantId, query);
    res.json({ success: true, data });
  },

  async presignAttachment(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await healthService.presignAttachment(
      tenantId,
      req.body as AttachmentPresignInput,
      profileId,
    );
    res.json({ success: true, data });
  },

  async downloadAttachment(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await healthService.getAttachmentDownloadUrl(
      paramId(req),
      tenantId,
      profileId,
    );
    res.json({ success: true, data });
  },

  async createVisit(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await healthService.saveVisit(
      tenantId,
      req.body as CreateHealthVisitInput,
      profileId,
    );
    res.status(201).json({ success: true, data });
  },

  async updateStudentHealthStatus(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const studentId = paramId(req, 'studentId');
    const body = req.body as UpdateStudentHealthStatusInput;
    const data = await healthService.updateStudentHealthStatus(
      studentId,
      tenantId,
      body.healthStatus,
      profileId,
    );
    res.json({ success: true, data });
  },
};
