import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import type { BulkAttendanceRecordInput, CreateSessionInput, UpdateSessionInput } from '../schemas/hostelAttendance.schemas';
import { dailyBoardQuerySchema, ensureSessionSchema, sessionListQuerySchema } from '../schemas/hostelAttendance.schemas';
import { hostelAttendanceService } from '../services/hostelAttendance.service';

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

export const hostelAttendanceController = {
  async listSessions(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = sessionListQuerySchema.parse(req.query);
    const { data, meta } = await hostelAttendanceService.listSessions(tenantId, query);
    res.json({ success: true, data, meta });
  },

  async createSession(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await hostelAttendanceService.createSession(
      tenantId,
      req.body as CreateSessionInput,
      profileId,
    );
    res.status(201).json({ success: true, data });
  },

  async ensureSession(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const body = ensureSessionSchema.parse(req.body);
    const data = await hostelAttendanceService.ensureSession(tenantId, body, profileId);
    res.json({ success: true, data });
  },

  async getDailyBoard(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = dailyBoardQuerySchema.parse(req.query);
    const data = await hostelAttendanceService.getDailyBoard(tenantId, query);
    res.json({ success: true, data });
  },

  async getSession(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelAttendanceService.getSession(paramId(req), tenantId);
    res.json({ success: true, data });
  },

  async updateSession(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelAttendanceService.updateSession(
      paramId(req),
      tenantId,
      req.body as UpdateSessionInput,
    );
    res.json({ success: true, data });
  },

  async listRecords(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelAttendanceService.listRecords(paramId(req), tenantId);
    res.json({ success: true, data });
  },

  async getSessionRoster(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelAttendanceService.getSessionRoster(paramId(req), tenantId);
    res.json({ success: true, data });
  },

  async upsertRecords(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelAttendanceService.upsertRecords(
      paramId(req),
      tenantId,
      req.body as BulkAttendanceRecordInput,
    );
    res.json({ success: true, data });
  },
};
