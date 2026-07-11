import type { TenantLookupOption } from '@/types/lookup';

export type RemarkSeverity = 'low' | 'medium' | 'high';

export type RemarkResolvedStatus = 'open' | 'resolved' | 'all';

export type RemarkSummary = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  severity: RemarkSeverity | null;
  tags: string[];
  isFlagged: boolean;
  followUpNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  remarkType: { id: number; value: string };
  category: { id: number; value: string };
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNumber: string;
    rollNumber: string | null;
    standard: { id: number; value: string } | null;
    section: { id: number; value: string } | null;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    roleName: string | null;
  };
};

export type RemarkStats = {
  total: number;
  positive: number;
  negative: number;
  observation: number;
};

export type RemarkListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  typeId?: number;
  categoryId?: number;
  days?: number;
  studentId?: string;
  resolvedStatus?: RemarkResolvedStatus;
};

export type CreateRemarkInput = {
  remarkTypeId: number;
  categoryId: number;
  title: string;
  description: string;
  severity?: RemarkSeverity;
  tags?: string[];
  isFlagged?: boolean;
};

export type RemarkTypeOption = TenantLookupOption;
export type RemarkCategoryOption = TenantLookupOption;
