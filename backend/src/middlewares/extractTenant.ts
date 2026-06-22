import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';

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

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('tenant_id, id, status')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single();

  if (profileError || !profile || profile.status !== 'Active') {
    next(new AppError(403, 'User profile not found or inactive'));
    return;
  }

  req.user = user;
  req.tenantId = profile.tenant_id;
  req.profileId = profile.id;
  next();
}
