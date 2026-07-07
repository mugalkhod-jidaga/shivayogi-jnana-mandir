import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import type {
  CreateAllocationInput,
  CreateBlockInput,
  CreateRoomInput,
  EndAllocationInput,
  TransferAllocationInput,
  UpdateBlockInput,
  UpdateRoomInput,
} from '../schemas/hostel.schemas';
import {
  allocationListQuerySchema,
  blockListQuerySchema,
  dailyReportQuerySchema,
  occupancyReportQuerySchema,
  roomListQuerySchema,
} from '../schemas/hostel.schemas';
import { hostelService } from '../services/hostel.service';

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

function paramInt(req: Request, key: string): number {
  const raw = req.params[key];
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(400, 'Invalid id');
  return n;
}

export const hostelController = {
  async getOverview(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelService.getOverview(tenantId);
    res.json({ success: true, data });
  },

  async listBlocks(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = blockListQuerySchema.parse(req.query);
    const { data, meta } = await hostelService.listBlocks(tenantId, query);
    res.json({ success: true, data, meta });
  },

  async createBlock(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelService.createBlock(tenantId, req.body as CreateBlockInput);
    res.status(201).json({ success: true, data });
  },

  async updateBlock(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await hostelService.updateBlock(
      paramInt(req, 'id'),
      tenantId,
      req.body as UpdateBlockInput,
      profileId,
    );
    res.json({ success: true, data });
  },

  async deleteBlock(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    await hostelService.deleteBlock(paramInt(req, 'id'), tenantId, profileId);
    res.json({ success: true, data: { id: paramInt(req, 'id') } });
  },

  async listRooms(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = roomListQuerySchema.parse(req.query);
    const { data, meta } = await hostelService.listRooms(tenantId, paramInt(req, 'blockId'), query);
    res.json({ success: true, data, meta });
  },

  async createRoom(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelService.createRoom(
      tenantId,
      paramInt(req, 'blockId'),
      req.body as CreateRoomInput,
    );
    res.status(201).json({ success: true, data });
  },

  async updateRoom(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await hostelService.updateRoom(
      paramInt(req, 'id'),
      tenantId,
      req.body as UpdateRoomInput,
      profileId,
    );
    res.json({ success: true, data });
  },

  async deleteRoom(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    await hostelService.deleteRoom(paramInt(req, 'id'), tenantId, profileId);
    res.json({ success: true, data: { id: paramInt(req, 'id') } });
  },

  async listBedsByRoom(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await hostelService.listBedsByRoom(tenantId, paramInt(req, 'roomId'));
    res.json({ success: true, data });
  },

  async listVacantBeds(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const blockId = req.query.blockId ? Number(req.query.blockId) : undefined;
    const data = await hostelService.listVacantBeds(
      tenantId,
      blockId && Number.isInteger(blockId) ? blockId : undefined,
    );
    res.json({ success: true, data });
  },

  async listAllocations(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = allocationListQuerySchema.parse(req.query);
    const { data, meta } = await hostelService.listAllocations(tenantId, query);
    res.json({ success: true, data, meta });
  },

  async createAllocation(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await hostelService.createAllocation(
      tenantId,
      req.body as CreateAllocationInput,
      profileId,
    );
    res.status(201).json({ success: true, data });
  },

  async transferAllocation(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await hostelService.transferAllocation(
      tenantId,
      req.body as TransferAllocationInput,
      profileId,
    );
    res.json({ success: true, data });
  },

  async endAllocation(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const data = await hostelService.endAllocation(
      paramId(req),
      tenantId,
      req.body as EndAllocationInput,
      profileId,
    );
    res.json({ success: true, data });
  },

  async deleteAllocation(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    await hostelService.deleteAllocation(paramId(req), tenantId, profileId);
    res.json({ success: true, data: { id: paramId(req) } });
  },

  async getDailyReport(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = dailyReportQuerySchema.parse(req.query);
    const data = await hostelService.getDailyReport(tenantId, query);
    res.json({ success: true, data });
  },

  async getOccupancyReport(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const query = occupancyReportQuerySchema.parse(req.query);
    const data = await hostelService.getOccupancyReport(tenantId, query);
    res.json({ success: true, data });
  },
};
