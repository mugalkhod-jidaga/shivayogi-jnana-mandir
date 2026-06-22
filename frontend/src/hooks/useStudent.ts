import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { studentKeys } from '@/hooks/useStudents';
import type {
  AvatarDownloadResponse,
  AvatarPresignResponse,
  CreateStudentPayload,
  DeactivateStudentPayload,
  StudentDetail,
  UpdateStudentPayload,
} from '@/types/student';

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? ''),
    queryFn: () => apiFetch<StudentDetail>(`/students/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStudentPayload) =>
      apiFetch<StudentDetail>('/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStudentPayload) =>
      apiFetch<StudentDetail>(`/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(studentKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useDeactivateStudent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeactivateStudentPayload) =>
      apiFetch<StudentDetail>(`/students/${id}/deactivate`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(studentKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useAvatarUpload(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const contentType = file.type || 'application/octet-stream';
      const presign = await apiFetch<AvatarPresignResponse>(`/students/${id}/avatar/presign`, {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, contentType }),
      });

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload avatar to storage (${uploadResponse.status})`);
      }

      return apiFetch<StudentDetail>(`/students/${id}/avatar/confirm`, {
        method: 'POST',
        body: JSON.stringify({ key: presign.key }),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(studentKeys.detail(id), data);
      queryClient.removeQueries({ queryKey: ['students', 'avatar', id] });
      queryClient.removeQueries({ queryKey: avatarThumbnailKeys.all });
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

const AVATAR_URL_STALE_TIME = 50 * 60 * 1000;

export const avatarThumbnailKeys = {
  all: ['students', 'avatar-thumbnails'] as const,
  page: (ids: string[]) => [...avatarThumbnailKeys.all, [...ids].sort().join(',')] as const,
};

export function useStudentAvatarThumbnails(students: { id: string; photoUrl: string | null }[]) {
  const idsWithPhotos = students.filter((student) => student.photoUrl).map((student) => student.id);

  return useQuery({
    queryKey: avatarThumbnailKeys.page(idsWithPhotos),
    queryFn: () =>
      apiFetch<Record<string, string>>('/students/avatars/urls', {
        method: 'POST',
        body: JSON.stringify({ ids: idsWithPhotos }),
      }),
    enabled: idsWithPhotos.length > 0,
    staleTime: AVATAR_URL_STALE_TIME,
  });
}

export function useStudentAvatarUrl(studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['students', 'avatar', studentId],
    queryFn: () => apiFetch<AvatarDownloadResponse>(`/students/${studentId}/avatar/download`),
    enabled,
    staleTime: AVATAR_URL_STALE_TIME,
    retry: false,
  });
}
