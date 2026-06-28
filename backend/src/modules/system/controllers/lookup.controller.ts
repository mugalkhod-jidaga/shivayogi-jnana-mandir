import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import type {
  CreateAcademicStandardInput,
  CreateAcademicYearInput,
  CreateLookupValueInput,
  UpdateAcademicYearInput,
  UpdateLookupValueInput,
} from '../schemas/lookup.schemas';
import { lookupService } from '../services/lookup.service';

function requireAuthContext(req: Request): { tenantId: number } {
  if (req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { tenantId: req.tenantId };
}

function paramLookupId(req: Request): number {
  const raw = req.params.id;
  const id = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'Invalid lookup id');
  }
  return id;
}

export const lookupController = {
  async listBloodGroups(req: Request, res: Response): Promise<void> {
    requireAuthContext(req);
    const data = await lookupService.listBloodGroups();
    res.json({ success: true, data });
  },

  async listAdmissionCategories(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.listAdmissionCategories(tenantId);
    res.json({ success: true, data });
  },

  async listDocumentTypes(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.listDocumentTypes(tenantId);
    res.json({ success: true, data });
  },

  async listAcademicStandards(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.listAcademicStandards(tenantId);
    res.json({ success: true, data });
  },

  async listSections(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.listSections(tenantId);
    res.json({ success: true, data });
  },

  async listAcademicYears(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.listAcademicYears(tenantId);
    res.json({ success: true, data });
  },

  async listLanguages(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.listLanguages(tenantId);
    res.json({ success: true, data });
  },

  async createAdmissionCategory(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.createAdmissionCategory(
      tenantId,
      req.body as CreateLookupValueInput,
    );
    res.status(201).json({ success: true, data });
  },

  async createDocumentType(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.createDocumentType(
      tenantId,
      req.body as CreateLookupValueInput,
    );
    res.status(201).json({ success: true, data });
  },

  async createAcademicStandard(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.createAcademicStandard(
      tenantId,
      req.body as CreateAcademicStandardInput,
    );
    res.status(201).json({ success: true, data });
  },

  async createSection(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.createSection(tenantId, req.body as CreateLookupValueInput);
    res.status(201).json({ success: true, data });
  },

  async createAcademicYear(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.createAcademicYear(
      tenantId,
      req.body as CreateAcademicYearInput,
    );
    res.status(201).json({ success: true, data });
  },

  async createLanguage(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.createLanguage(tenantId, req.body as CreateLookupValueInput);
    res.status(201).json({ success: true, data });
  },

  async updateAdmissionCategory(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.updateAdmissionCategory(
      paramLookupId(req),
      tenantId,
      req.body as UpdateLookupValueInput,
    );
    res.json({ success: true, data });
  },

  async updateDocumentType(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.updateDocumentType(
      paramLookupId(req),
      tenantId,
      req.body as UpdateLookupValueInput,
    );
    res.json({ success: true, data });
  },

  async updateAcademicStandard(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.updateAcademicStandard(
      paramLookupId(req),
      tenantId,
      req.body as UpdateLookupValueInput & { sortOrder?: number },
    );
    res.json({ success: true, data });
  },

  async updateSection(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.updateSection(
      paramLookupId(req),
      tenantId,
      req.body as UpdateLookupValueInput,
    );
    res.json({ success: true, data });
  },

  async updateAcademicYear(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.updateAcademicYear(
      paramLookupId(req),
      tenantId,
      req.body as UpdateAcademicYearInput,
    );
    res.json({ success: true, data });
  },

  async updateLanguage(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);
    const data = await lookupService.updateLanguage(
      paramLookupId(req),
      tenantId,
      req.body as UpdateLookupValueInput,
    );
    res.json({ success: true, data });
  },
};
