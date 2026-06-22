export type LookupOption = {
  id: number;
  value: string;
  isActive: boolean;
};

export type TenantLookupOption = LookupOption & {
  tenantId: number;
};
