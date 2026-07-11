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
    const { roles } = await this.findRolesAndPermissions(userId);
    return roles;
  }

  /** One round-trip for roles + permission actions (used by getMe). */
  async findRolesAndPermissions(userId: string): Promise<{
    roles: { id: number; name: string }[];
    permissions: string[];
  }> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(id, name, role_permissions(permissions(action)))')
      .eq('user_id', userId);

    if (error) throw new AppError(500, error.message);

    const roles: { id: number; name: string }[] = [];
    const actions = new Set<string>();

    for (const row of data ?? []) {
      const roleRaw = row.roles;
      const role = (
        Array.isArray(roleRaw) ? roleRaw[0] : roleRaw
      ) as {
        id: number;
        name: string;
        role_permissions:
          | { permissions: { action: string } | { action: string }[] | null }
          | { permissions: { action: string } | { action: string }[] | null }[]
          | null;
      } | null;

      if (!role) continue;
      roles.push({ id: role.id, name: role.name });

      const rpList = Array.isArray(role.role_permissions)
        ? role.role_permissions
        : role.role_permissions
          ? [role.role_permissions]
          : [];

      for (const rp of rpList) {
        const permission = rp.permissions;
        if (!permission) continue;
        if (Array.isArray(permission)) {
          permission.forEach((p) => actions.add(p.action));
        } else {
          actions.add(permission.action);
        }
      }
    }

    return { roles, permissions: [...actions] };
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

  async searchActiveStaff(tenantId: number, search: string | undefined, limit: number) {
    let query = supabase
      .from('user_profiles')
      .select('id, first_name, last_name, phone_number, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'Active')
      .is('deleted_at', null)
      .order('first_name')
      .limit(limit);

    if (search?.trim()) {
      query = query.or(
        `first_name.ilike.%${search.trim()}%,last_name.ilike.%${search.trim()}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw new AppError(500, error.message);

    return (data ?? []).map((row) => ({
      id: row.id as string,
      firstName: row.first_name as string,
      lastName: row.last_name as string | null,
      phoneNumber: row.phone_number as string,
      status: row.status as string,
    }));
  }
}

export const usersRepository = new UsersRepository();
