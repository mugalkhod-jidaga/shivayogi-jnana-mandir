import type { LookupOption } from '@/types/lookup';

export type DocumentStatus = 'Pending Review' | 'Verified' | 'Rejected' | 'Renewal Needed';

export type StudentDocument = {
  id: string;
  studentId: string;
  documentType: LookupOption | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: DocumentStatus;
  expiryDate: string | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  uploadedAt: string;
};

export type DocumentWithStudent = StudentDocument & {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string | null;
  };
};

export type DocumentPresignResponse = {
  uploadUrl: string;
  key: string;
};

export type DocumentDownloadResponse = {
  downloadUrl: string;
};

export type DocumentVerifyPayload = {
  status: Exclude<DocumentStatus, 'Pending Review'>;
};

export type DocumentUploadInput = {
  file: File;
  documentTypeId: number;
  expiryDate?: string;
};
