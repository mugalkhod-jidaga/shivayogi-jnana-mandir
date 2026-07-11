import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import type { UserProfileRow } from '../modules/auth/repositories/userProfile.repository';
import {
  readTenantFromAppMetadata,
  staffAppMetadata,
} from '../modules/auth/utils/authMetadata';
import { AppError } from '../utils/AppError';

const PROFILE_SELECT =
  'id, tenant_id, first_name, last_name, phone_number, email, status, must_reset_password, created_at, updated_at';

/** Backfill JWT claims once so later requests can skip the profile lookup. */
function backfillAppMetadata(userId: string, tenantId: number, status: string): void {
  if (status !== 'Active' && status !== 'Inactive') return;
  void supabase.auth.admin.updateUserById(userId, {
    app_metadata: staffAppMetadata(tenantId, status),
  });
}

export async function extractTenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    next(new AppError(401, 'Missing token'));
    return;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ success: false, error: 'TOKEN_EXPIRED_OR_INVALID' });
    return;
  }

  const fromJwt = readTenantFromAppMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
  );

  if (fromJwt?.status === 'Active') {
    req.user = user;
    req.tenantId = fromJwt.tenantId;
    req.profileId = user.id;
    next();
    return;
  }

  if (fromJwt?.status === 'Inactive') {
    next(new AppError(403, 'User profile not found or inactive'));
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(PROFILE_SELECT)
    .eq('id', user.id)
    .is('deleted_at', null)
    .single();

  if (profileError || !profile || profile.status !== 'Active') {
    next(new AppError(403, 'User profile not found or inactive'));
    return;
  }

  const row = profile as UserProfileRow;
  backfillAppMetadata(user.id, row.tenant_id, row.status);

  req.user = user;
  req.tenantId = row.tenant_id;
  req.profileId = row.id;
  req.userProfile = row;
  next();
}
