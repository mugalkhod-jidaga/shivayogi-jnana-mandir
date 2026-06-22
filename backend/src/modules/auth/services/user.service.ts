import { AppError } from '../../../utils/AppError';
import { userProfileRepository } from '../repositories/userProfile.repository';
import { permissionService } from './permission.service';

export const userService = {
  async getMe(userId: string, tenantId: number) {
    const profile = await userProfileRepository.findById(userId, tenantId);
    if (!profile) {
      throw new AppError(404, 'User profile not found');
    }

    const roles = await userProfileRepository.findRoles(userId);
    const permissions = await permissionService.getUserPermissions(userId);

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
      permissions,
    };
  },
};
