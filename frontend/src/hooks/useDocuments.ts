import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type {
  DocumentDownloadResponse,
  DocumentPresignResponse,
  DocumentUploadInput,
  DocumentVerifyPayload,
  DocumentWithStudent,
  StudentDocument,
} from '@/types/document';

const MAX_FILE_SIZE = 26_214_400; // 25MB

export const documentKeys = {
  all: ['documents'] as const,
  byStudent: (studentId: string) => ['documents', 'student', studentId] as const,
  queue: (params: DocumentQueueParams) => ['documents', 'queue', params] as const,
};

export type DocumentQueueParams = {
  page: number;
  search?: string;
  status?: string;
};

export function useStudentDocuments(studentId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.byStudent(studentId ?? ''),
    queryFn: () => apiFetch<StudentDocument[]>(`/students/${studentId}/documents`),
    enabled: Boolean(studentId),
  });
}

export function useDocumentQueue(params: DocumentQueueParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);

  return useQuery({
    queryKey: documentKeys.queue(params),
    queryFn: () =>
      apiFetchPaginated<DocumentWithStudent>(`/documents?${searchParams.toString()}`),
  });
}

export function useDocumentUpload(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentTypeId, expiryDate }: DocumentUploadInput) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File must be 25 MB or smaller');
      }

      const contentType = file.type || 'application/octet-stream';
      const presign = await apiFetch<DocumentPresignResponse>(
        `/students/${studentId}/documents/presign`,
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            documentTypeId,
            mimeType: contentType,
          }),
        },
      );

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file to storage (${uploadResponse.status})`);
      }

      return apiFetch<StudentDocument>(`/students/${studentId}/documents/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          key: presign.key,
          documentTypeId,
          originalFilename: file.name,
          mimeType: contentType,
          fileSize: file.size,
          ...(expiryDate ? { expiryDate } : {}),
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.byStudent(studentId) });
      void queryClient.invalidateQueries({ queryKey: ['documents', 'queue'] });
    },
  });
}

export function useDocumentDownload() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { downloadUrl } = await apiFetch<DocumentDownloadResponse>(
        `/documents/${documentId}/download`,
      );
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    },
  });
}

export function useDocumentVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, ...payload }: DocumentVerifyPayload & { documentId: string }) =>
      apiFetch<StudentDocument>(`/documents/${documentId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.byStudent(data.studentId) });
      void queryClient.invalidateQueries({ queryKey: ['documents', 'queue'] });
    },
  });
}
