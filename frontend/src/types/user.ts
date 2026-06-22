export type Role = {
  id: number;
  name: string;
};

export type MeResponse = {
  id: string;
  tenantId: number;
  firstName: string;
  lastName: string | null;
  phoneNumber: string;
  email: string | null;
  status: string;
  mustResetPassword: boolean;
  roles: Role[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};
