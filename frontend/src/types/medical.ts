import type { TenantLookupOption } from '@/types/lookup';

export type MedicalRecord = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  recordedOn: string;
  isOngoing: boolean;
  createdAt: string;
  updatedAt: string;
  recordType: { id: number; value: string };
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNumber: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
};

export type MedicalListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  typeId?: number;
  studentId?: string;
};

export type CreateMedicalRecordInput = {
  recordTypeId: number;
  title: string;
  description: string;
  recordedOn: string;
  isOngoing?: boolean;
};

export type MedicalRecordTypeOption = TenantLookupOption;
