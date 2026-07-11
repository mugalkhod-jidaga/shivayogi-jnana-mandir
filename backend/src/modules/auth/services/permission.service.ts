import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

type PermissionRef = { action: string } | { action: string }[] | null;
type RolePermissionRow = { permissions: PermissionRef };
type RoleWithPermissions = {
  id: number;
  name: string;
  role_permissions: RolePermissionRow | RolePermissionRow[] | null;
} | null;

function collectActions(rolePermissions: RolePermissionRow | RolePermissionRow[] | null): string[] {
  const list = Array.isArray(rolePermissions)
    ? rolePermissions
    : rolePermissions
      ? [rolePermissions]
      : [];
  const actions = new Set<string>();

  for (const row of list) {
    const permission = row.permissions;
    if (!permission) continue;
    if (Array.isArray(permission)) {
      permission.forEach((p) => actions.add(p.action));
    } else {
      actions.add(permission.action);
    }
  }

  return [...actions];
}

class PermissionService {
  /** Single round-trip: user_roles → roles → role_permissions → permissions. */
  async getUserPermissions(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(role_permissions(permissions(action)))')
      .eq('user_id', userId);

    if (error) throw new AppError(500, error.message);
    if (!data?.length) return [];

    const actions = new Set<string>();
    for (const row of data) {
      const role = (
        Array.isArray(row.roles) ? row.roles[0] : row.roles
      ) as RoleWithPermissions;
      if (!role) continue;
      for (const action of collectActions(role.role_permissions)) {
        actions.add(action);
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
