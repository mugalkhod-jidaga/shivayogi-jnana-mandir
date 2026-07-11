import type { User } from '@supabase/supabase-js';
import type { UserProfileRow } from '../modules/auth/repositories/userProfile.repository';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    tenantId?: number;
    profileId?: string;
    /** Present when middleware loaded the profile from DB (JWT miss). */
    userProfile?: UserProfileRow;
  }
}

export {};
