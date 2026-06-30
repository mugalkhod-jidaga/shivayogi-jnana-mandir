export type LookupOption = {
  id: number;
  value: string;
  isActive: boolean;
};

export type TenantLookupOption = LookupOption & {
  tenantId: number;
  labels?: Record<string, string>;
};

export type AcademicStandardOption = TenantLookupOption & {
  sortOrder: number;
};

export type AcademicYearOption = {
  id: number;
  tenantId: number;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};
