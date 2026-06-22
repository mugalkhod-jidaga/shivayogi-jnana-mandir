import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

class PermissionService {
  async getUserPermissions(userId: string): Promise<string[]> {
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (rolesError) throw new AppError(500, rolesError.message);
    if (!userRoles?.length) return [];

    const roleIds = userRoles.map((row) => row.role_id);

    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(action)')
      .in('role_id', roleIds);

    if (permError) throw new AppError(500, permError.message);

    const actions = new Set<string>();
    for (const row of rolePermissions ?? []) {
      const permission = row.permissions as { action: string } | { action: string }[] | null;
      if (!permission) continue;
      if (Array.isArray(permission)) {
        permission.forEach((p) => actions.add(p.action));
      } else {
        actions.add(permission.action);
      }
    }

    return [...actions];
  }

  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }
}

export const permissionService = new PermissionService();
