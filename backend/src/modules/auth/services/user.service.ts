import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { generateTempPassword } from '../../../utils/password';
import type { CreateStaffInput, UpdateStaffInput } from '../schemas/user.schemas';
import { roleRepository } from '../repositories/role.repository';
import { usersRepository } from '../repositories/users.repository';
import type { UserProfileRow } from '../repositories/userProfile.repository';
import { permissionService } from './permission.service';

function serializeStaff(profile: UserProfileRow, roles: { id: number; name: string }[]) {
  return {
    id: profile.id,
    tenantId: profile.tenant_id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phoneNumber: profile.phone_number,
    email: profile.email,
    status: profile.status,
    mustResetPassword: profile.must_reset_password,
    roles,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export const userService = {
  async getMe(userId: string, tenantId: number) {
    const profile = await usersRepository.findById(userId, tenantId);
    if (!profile) {
      throw new AppError(404, 'User profile not found');
    }

    const roles = await usersRepository.findRoles(userId);
    const permissions = await permissionService.getUserPermissions(userId);

    return {
      ...serializeStaff(profile, roles),
      permissions,
    };
  },

  async list(tenantId: number, page: number, limit: number, search?: string) {
    const { data, meta } = await usersRepository.list(tenantId, page, limit, search);
    const profiles = data as UserProfileRow[];

    const staff = await Promise.all(
      profiles.map(async (profile) => {
        const roles = await usersRepository.findRoles(profile.id);
        return serializeStaff(profile, roles);
      }),
    );

    return { data: staff, meta };
  },

  async getById(userId: string, tenantId: number) {
    const profile = await usersRepository.findById(userId, tenantId);
    if (!profile) {
      throw new AppError(404, 'Staff member not found');
    }

    const roles = await usersRepository.findRoles(userId);
    return serializeStaff(profile, roles);
  },

  async createStaff(tenantId: number, input: CreateStaffInput, _createdBy: string) {
    const role = await roleRepository.findById(input.roleId, tenantId);
    if (!role) {
      throw new AppError(400, 'Invalid role for this tenant');
    }

    const tempPassword = generateTempPassword();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      phone: input.phone,
      password: tempPassword,
      phone_confirm: true,
    });

    if (authError) {
      throw new AppError(400, authError.message);
    }

    try {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: authUser.user.id,
        tenant_id: tenantId,
        first_name: input.firstName,
        last_name: input.lastName ?? null,
        phone_number: input.phone,
        must_reset_password: true,
      });

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authUser.user.id, role_id: input.roleId });

      if (roleError) throw roleError;

      const profile = await usersRepository.findById(authUser.user.id, tenantId);
      if (!profile) {
        throw new AppError(500, 'Failed to load created staff profile');
      }

      return {
        staff: serializeStaff(profile, [role]),
        tempPassword,
      };
    } catch (err) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      const message = err instanceof Error ? err.message : 'Failed to create staff profile';
      throw new AppError(500, `Failed to create staff profile; auth account rolled back: ${message}`);
    }
  },

  async updateStaff(
    userId: string,
    tenantId: number,
    input: UpdateStaffInput,
    actorId: string,
  ) {
    const profile = await usersRepository.findById(userId, tenantId);
    if (!profile) {
      throw new AppError(404, 'Staff member not found');
    }

    if (input.roleId !== undefined) {
      const role = await roleRepository.findById(input.roleId, tenantId);
      if (!role) {
        throw new AppError(400, 'Invalid role for this tenant');
      }
      await usersRepository.replaceRole(userId, input.roleId);
    }

    const profileChanges: Record<string, unknown> = {};
    if (input.firstName !== undefined) profileChanges.first_name = input.firstName;
    if (input.lastName !== undefined) profileChanges.last_name = input.lastName;

    let updatedProfile = profile;
    if (Object.keys(profileChanges).length > 0) {
      updatedProfile = (await usersRepository.update(
        userId,
        tenantId,
        profileChanges,
        actorId,
      )) as UserProfileRow;
    }

    const roles = await usersRepository.findRoles(userId);
    return serializeStaff(updatedProfile, roles);
  },

  async deactivate(userId: string, tenantId: number, actorId: string) {
    const profile = await usersRepository.findById(userId, tenantId);
    if (!profile) {
      throw new AppError(404, 'Staff member not found');
    }

    if (profile.status === 'Inactive') {
      throw new AppError(400, 'Staff member is already inactive');
    }

    if (userId === actorId) {
      throw new AppError(400, 'You cannot deactivate your own account');
    }

    const updated = (await usersRepository.update(
      userId,
      tenantId,
      { status: 'Inactive' },
      actorId,
    )) as UserProfileRow;

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    });

    if (authError) {
      throw new AppError(500, `Profile deactivated but auth ban failed: ${authError.message}`);
    }

    const roles = await usersRepository.findRoles(userId);
    return serializeStaff(updated, roles);
  },

  async resetPassword(userId: string, tenantId: number, actorId: string) {
    const profile = await usersRepository.findById(userId, tenantId);
    if (!profile) {
      throw new AppError(404, 'Staff member not found');
    }

    if (profile.status !== 'Active') {
      throw new AppError(400, 'Cannot reset password for an inactive staff member');
    }

    const tempPassword = generateTempPassword();

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    if (authError) {
      throw new AppError(500, authError.message);
    }

    const updated = (await usersRepository.update(
      userId,
      tenantId,
      { must_reset_password: true },
      actorId,
    )) as UserProfileRow;

    const roles = await usersRepository.findRoles(userId);
    return {
      staff: serializeStaff(updated, roles),
      tempPassword,
    };
  },
};

export const roleService = {
  list(tenantId: number) {
    return roleRepository.listByTenant(tenantId);
  },
};
