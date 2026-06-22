import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import { paginationSchema } from '../../../utils/validators';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { dashboardService } from '../services/dashboard.service';

function requireAuthContext(req: Request): { tenantId: number } {
  if (req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { tenantId: req.tenantId };
}

export const dashboardController = {
  async summary(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await dashboardService.getSummary(tenantId);
    res.json({ success: true, data });
  },

  async complianceReport(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await dashboardService.getComplianceReport(tenantId);
    res.json({ success: true, data });
  },
};

export const auditLogController = {
  async list(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const { page, limit, search } = paginationSchema.parse(req.query);
    const { data, meta } = await auditLogRepository.list(tenantId, page, limit, search);
    res.json({ success: true, data, meta });
  },
};
