import type { Request, Response } from 'express';
import { AppError } from '../../../utils/AppError';
import type { MigrationCommitInput } from '../schemas/migration.schemas';
import { migrationService } from '../services/migration.service';

function requireAuthContext(req: Request): { profileId: string; tenantId: number } {
  if (!req.profileId || req.tenantId === undefined) {
    throw new AppError(401, 'Not authenticated');
  }
  return { profileId: req.profileId, tenantId: req.tenantId };
}

export const migrationController = {
  async parse(req: Request, res: Response): Promise<void> {
    const { tenantId } = requireAuthContext(req);

    const file = req.file;
    if (!file) {
      throw new AppError(400, 'No file uploaded. Use multipart field name "file".');
    }

    const data = await migrationService.parseFile(tenantId, file.buffer, file.originalname);
    res.json({ success: true, data });
  },

  async commit(req: Request, res: Response): Promise<void> {
    const { profileId, tenantId } = requireAuthContext(req);
    const { students } = req.body as MigrationCommitInput;
    const data = await migrationService.commit(tenantId, profileId, students);
    res.json({ success: true, data });
  },
};
