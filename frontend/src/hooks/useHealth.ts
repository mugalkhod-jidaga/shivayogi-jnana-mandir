import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type {
  CreateHealthVisitInput,
  HealthDashboardStats,
  HealthStaffOption,
  HealthVisit,
  HealthVisitListFilters,
  HealthVisitSummary,
  MedicineCatalogItem,
  PendingPhoto,
  VisitAttachmentInput,
} from '@/types/health';

export const healthKeys = {
  all: ['health'] as const,
  list: (filters: HealthVisitListFilters) => [...healthKeys.all, 'list', filters] as const,
  recent: (search?: string) => [...healthKeys.all, 'recent', search ?? ''] as const,
  byStudent: (studentId: string, filters: HealthVisitListFilters) =>
    [...healthKeys.all, 'student', studentId, filters] as const,
  summary: (studentId: string) => [...healthKeys.all, 'summary', studentId] as const,
  detail: (id: string) => [...healthKeys.all, 'detail', id] as const,
  dashboard: ['health', 'dashboard'] as const,
  catalog: (q: string, issueTypes: string) =>
    [...healthKeys.all, 'catalog', q, issueTypes] as const,
  staff: (q: string) => [...healthKeys.all, 'staff', q] as const,
};

function buildListQuery(filters: HealthVisitListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.severityId) params.set('severityId', String(filters.severityId));
  if (filters.standardId) params.set('standardId', String(filters.standardId));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  return params.toString();
}

export function useHealthVisitsList(filters: HealthVisitListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: healthKeys.list(normalized),
    queryFn: () => apiFetchPaginated<HealthVisit>(`/health/visits?${buildListQuery(normalized)}`),
    placeholderData: (prev) => prev,
  });
}

export function useRecentHealthVisits(search?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: healthKeys.recent(search),
    queryFn: () => apiFetch<HealthVisit[]>(`/health/visits/recent?${params.toString()}`),
  });
}

export function useStudentHealthVisits(studentId: string | undefined, filters: HealthVisitListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: healthKeys.byStudent(studentId ?? '', normalized),
    queryFn: () =>
      apiFetchPaginated<HealthVisit>(
        `/health/students/${studentId}/visits?${buildListQuery(normalized)}`,
      ),
    enabled: Boolean(studentId),
  });
}

export function useStudentHealthSummary(studentId: string | undefined) {
  return useQuery({
    queryKey: healthKeys.summary(studentId ?? ''),
    queryFn: () => apiFetch<HealthVisitSummary>(`/health/students/${studentId}/visit-summary`),
    enabled: Boolean(studentId),
  });
}

export function useHealthVisit(visitId: string | undefined) {
  return useQuery({
    queryKey: healthKeys.detail(visitId ?? ''),
    queryFn: () => apiFetch<HealthVisit>(`/health/visits/${visitId}`),
    enabled: Boolean(visitId),
  });
}

const ATTACHMENT_URL_STALE = 50 * 60 * 1000;

export function useHealthAttachmentUrl(attachmentId: string | undefined) {
  return useQuery({
    queryKey: [...healthKeys.all, 'attachment', attachmentId ?? ''],
    queryFn: () =>
      apiFetch<{ downloadUrl: string }>(`/health/attachments/${attachmentId}/download`),
    enabled: Boolean(attachmentId),
    staleTime: ATTACHMENT_URL_STALE,
    retry: false,
  });
}

export function useCreateHealthVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHealthVisitInput) =>
      apiFetch<HealthVisit>('/health/visits', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: healthKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useHealthDashboardStats() {
  return useQuery({
    queryKey: healthKeys.dashboard,
    queryFn: () => apiFetch<HealthDashboardStats>('/health/dashboard/stats'),
    staleTime: 60_000,
  });
}

export function useMedicineCatalogSuggest(query: string, issueTypes: string[]) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (issueTypes.length) params.set('issueTypes', issueTypes.join(','));
  params.set('limit', '10');

  return useQuery({
    queryKey: healthKeys.catalog(query, issueTypes.join(',')),
    queryFn: () => apiFetch<MedicineCatalogItem[]>(`/health/medicine-catalog/suggest?${params}`),
    enabled: query.trim().length >= 1 || issueTypes.length > 0,
    staleTime: 30_000,
  });
}

export function useHealthStaffSearch(query: string) {
  const params = new URLSearchParams({ limit: '6' });
  if (query.trim()) params.set('q', query.trim());

  return useQuery({
    queryKey: healthKeys.staff(query),
    queryFn: () => apiFetch<HealthStaffOption[]>(`/health/staff/search?${params}`),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export async function uploadHealthAttachment(
  studentId: string,
  file: File,
): Promise<VisitAttachmentInput> {
  const contentType = file.type || 'application/octet-stream';
  const presign = await apiFetch<{ uploadUrl: string; key: string }>('/health/attachments/presign', {
    method: 'POST',
    body: JSON.stringify({ studentId, filename: file.name, mimeType: contentType }),
  });

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Photo upload failed (${uploadResponse.status})`);
  }

  return {
    key: presign.key,
    fileName: file.name,
    mimeType: contentType,
    sizeBytes: file.size,
  };
}

export async function uploadPendingPhotos(
  studentId: string,
  photos: PendingPhoto[],
): Promise<VisitAttachmentInput[]> {
  const results: VisitAttachmentInput[] = [];
  for (const photo of photos) {
    results.push(await uploadHealthAttachment(studentId, photo.file));
  }
  return results;
}
