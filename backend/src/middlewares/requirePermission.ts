import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { permissionService } from '../modules/auth/services/permission.service';

export function requirePermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.profileId) {
      next(new AppError(401, 'Missing authenticated profile'));
      return;
    }

    const hasPermission = await permissionService.checkUserPermission(req.profileId, permission);
    if (!hasPermission) {
      next(new AppError(403, 'Permission denied'));
      return;
    }

    next();
  };
}

/** Pass if the user has at least one of the listed permissions. */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.profileId) {
      next(new AppError(401, 'Missing authenticated profile'));
      return;
    }

    for (const permission of permissions) {
      const allowed = await permissionService.checkUserPermission(req.profileId, permission);
      if (allowed) {
        next();
        return;
      }
    }

    next(new AppError(403, 'Permission denied'));
  };
}
