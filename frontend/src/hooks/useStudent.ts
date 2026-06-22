import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { studentKeys } from '@/hooks/useStudents';
import type {
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
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
