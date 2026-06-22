import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

export interface RoleRow {
  id: number;
  name: string;
}

class RoleRepository {
  async listByTenant(tenantId: number): Promise<RoleRow[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw new AppError(500, error.message);
    return data ?? [];
  }

  async findById(roleId: number, tenantId: number): Promise<RoleRow | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AppError(500, error.message);
    }

    return data;
  }
}

export const roleRepository = new RoleRepository();
