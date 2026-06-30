import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type {
  HostelAttendanceRecord,
  HostelAttendanceSession,
  HostelBlock,
  HostelRoom,
  RoomAllocation,
} from '@/types/hostel';

export const hostelKeys = {
  all: ['hostel'] as const,
  blocks: (page: number, search?: string) => [...hostelKeys.all, 'blocks', page, search] as const,
  rooms: (blockId: number) => [...hostelKeys.all, 'rooms', blockId] as const,
  allocations: (params: Record<string, unknown>) => [...hostelKeys.all, 'allocations', params] as const,
  attendance: ['hostel-attendance'] as const,
  sessions: (params: Record<string, unknown>) => [...hostelKeys.attendance, 'sessions', params] as const,
  sessionRecords: (sessionId: string) => [...hostelKeys.attendance, 'records', sessionId] as const,
};

export function useHostelBlocks(page = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: hostelKeys.blocks(page, search),
    queryFn: () => apiFetchPaginated<HostelBlock>(`/hostel/blocks?${params}`),
  });
}

export function useHostelRooms(blockId: number | undefined) {
  return useQuery({
    queryKey: hostelKeys.rooms(blockId ?? 0),
    queryFn: () => apiFetchPaginated<HostelRoom>(`/hostel/blocks/${blockId}/rooms?limit=100`),
    enabled: Boolean(blockId),
  });
}

export function useRoomAllocations(filters: {
  page?: number;
  activeOnly?: boolean;
  blockId?: number;
} = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: '20',
  });
  if (filters.activeOnly) params.set('activeOnly', 'true');
  if (filters.blockId) params.set('blockId', String(filters.blockId));

  return useQuery({
    queryKey: hostelKeys.allocations(filters),
    queryFn: () => apiFetchPaginated<RoomAllocation>(`/hostel/allocations?${params}`),
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      apiFetch<HostelBlock>('/hostel/blocks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: hostelKeys.all }),
  });
}

export function useCreateRoom(blockId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { roomNumber: string; capacity: number }) =>
      apiFetch<HostelRoom>(`/hostel/blocks/${blockId}/rooms`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hostelKeys.rooms(blockId) });
      void qc.invalidateQueries({ queryKey: hostelKeys.all });
    },
  });
}

export function useCreateAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      studentId: string;
      roomId: number;
      allocatedFrom: string;
      notes?: string;
    }) =>
      apiFetch<RoomAllocation>('/hostel/allocations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: hostelKeys.all }),
  });
}

export function useHostelAttendanceSessions(filters: { page?: number; attendanceDate?: string } = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: '20',
  });
  if (filters.attendanceDate) params.set('attendanceDate', filters.attendanceDate);

  return useQuery({
    queryKey: hostelKeys.sessions(filters),
    queryFn: () =>
      apiFetchPaginated<HostelAttendanceSession>(`/hostel-attendance/sessions?${params}`),
  });
}

export function useHostelAttendanceRecords(sessionId: string | undefined) {
  return useQuery({
    queryKey: hostelKeys.sessionRecords(sessionId ?? ''),
    queryFn: () => apiFetch<HostelAttendanceRecord[]>(`/hostel-attendance/sessions/${sessionId}/records`),
    enabled: Boolean(sessionId),
  });
}

export function useCreateAttendanceSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { attendanceDate: string; blockId?: number; notes?: string }) =>
      apiFetch<HostelAttendanceSession>('/hostel-attendance/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: hostelKeys.attendance }),
  });
}

export function useUpsertAttendanceRecords(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: Array<{ studentId: string; statusId: number; notes?: string }>) =>
      apiFetch<HostelAttendanceRecord[]>(`/hostel-attendance/sessions/${sessionId}/records`, {
        method: 'POST',
        body: JSON.stringify({ records }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: hostelKeys.sessionRecords(sessionId) }),
  });
}
