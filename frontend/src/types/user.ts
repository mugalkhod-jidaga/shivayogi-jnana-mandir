export type Role = {
  id: number;
  name: string;
};

export type StaffStatus = 'Active' | 'Inactive';

export type StaffMember = {
  id: string;
  tenantId: number;
  firstName: string;
  lastName: string | null;
  phoneNumber: string;
  email: string | null;
  status: StaffStatus;
  mustResetPassword: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = StaffMember & {
  permissions: string[];
};

export type CreateStaffPayload = {
  firstName: string;
  lastName?: string;
  phone: string;
  roleId: number;
};

export type UpdateStaffPayload = {
  firstName?: string;
  lastName?: string | null;
  roleId?: number;
};

export type TempPasswordMeta = {
  tempPassword: string;
};
