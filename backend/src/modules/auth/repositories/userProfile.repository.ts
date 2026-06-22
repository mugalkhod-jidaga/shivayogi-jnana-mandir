import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

export interface UserProfileRow {
  id: string;
  tenant_id: number;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  email: string | null;
  status: string;
  must_reset_password: boolean;
  created_at: string;
  updated_at: string;
}

class UserProfileRepository {
  async findById(userId: string, tenantId: number): Promise<UserProfileRow | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AppError(500, error.message);
    }

    return data;
  }

  async findRoles(userId: string): Promise<{ id: number; name: string }[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id, roles(id, name)')
      .eq('user_id', userId);

    if (error) throw new AppError(500, error.message);

    return (data ?? [])
      .map((row) => {
        const roles = row.roles;
        if (Array.isArray(roles)) return roles[0] ?? null;
        return roles as { id: number; name: string } | null;
      })
      .filter((role): role is { id: number; name: string } => role !== null);
  }
}

export const userProfileRepository = new UserProfileRepository();
