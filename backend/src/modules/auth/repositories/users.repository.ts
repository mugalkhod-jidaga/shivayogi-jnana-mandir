import { supabase } from '../../../config/supabase';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { AppError } from '../../../utils/AppError';
import type { UserProfileRow } from './userProfile.repository';

export class UsersRepository extends BaseRepository {
  constructor() {
    super('user_profiles');
  }

  list(tenantId: number, page: number, limit: number, search?: string) {
    return this.findAll(tenantId, {
      page,
      limit,
      search,
      searchColumns: ['first_name', 'last_name', 'phone_number'],
    });
  }

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

  async findAssignedStandardIds(userId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('user_standard_assignments')
      .select('standard_id')
      .eq('user_id', userId);

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => row.standard_id as number);
  }

  async replaceAssignedStandardIds(userId: string, standardIds: number[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('user_standard_assignments')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw new AppError(500, deleteError.message);

    if (standardIds.length === 0) return;

    const rows = standardIds.map((standardId) => ({ user_id: userId, standard_id: standardId }));
    const { error: insertError } = await supabase.from('user_standard_assignments').insert(rows);
    if (insertError) throw new AppError(500, insertError.message);
  }

  async replaceRole(userId: string, roleId: number): Promise<void> {
    const { error: deleteError } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (deleteError) throw new AppError(500, deleteError.message);

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId });

    if (insertError) throw new AppError(500, insertError.message);
  }
}

export const usersRepository = new UsersRepository();
