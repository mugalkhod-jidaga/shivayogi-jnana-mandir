import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type {
  HostelAttendanceRecord,
  HostelAttendanceSession,
  HostelBed,
  HostelBlock,
  HostelDailyReport,
  HostelOccupancyReport,
  HostelOverview,
  HostelRoom,
  RoomAllocation,
} from '@/types/hostel';

export const hostelKeys = {
  all: ['hostel'] as const,
  overview: ['hostel', 'overview'] as const,
  blocks: (page: number, search?: string) => [...hostelKeys.all, 'blocks', page, search] as const,
  rooms: (blockId: number) => [...hostelKeys.all, 'rooms', blockId] as const,
  beds: (roomId: number) => [...hostelKeys.all, 'beds', roomId] as const,
  vacantBeds: (blockId?: number) => [...hostelKeys.all, 'vacant-beds', blockId ?? 'all'] as const,
  allocations: (params: Record<string, unknown>) => [...hostelKeys.all, 'allocations', params] as const,
  dailyReport: (date: string, blockId?: number) =>
    [...hostelKeys.all, 'reports', 'daily', date, blockId ?? 'all'] as const,
  occupancyReport: (blockId?: number) =>
    [...hostelKeys.all, 'reports', 'occupancy', blockId ?? 'all'] as const,
  attendance: ['hostel-attendance'] as const,
  sessions: (params: Record<string, unknown>) => [...hostelKeys.attendance, 'sessions', params] as const,
  sessionRecords: (sessionId: string) => [...hostelKeys.attendance, 'records', sessionId] as const,
};

export function useHostelOverview() {
  return useQuery({
    queryKey: hostelKeys.overview,
    queryFn: () => apiFetch<HostelOverview>('/hostel/overview'),
    staleTime: 60_000,
  });
}

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

export function useRoomBeds(roomId: number | undefined) {
  return useQuery({
    queryKey: hostelKeys.beds(roomId ?? 0),
    queryFn: () => apiFetch<HostelBed[]>(`/hostel/rooms/${roomId}/beds`),
    enabled: Boolean(roomId),
  });
}

export function useVacantBeds(blockId?: number) {
  const params = blockId ? `?blockId=${blockId}` : '';
  return useQuery({
    queryKey: hostelKeys.vacantBeds(blockId),
    queryFn: () => apiFetch<HostelBed[]>(`/hostel/beds/vacant${params}`),
  });
}

export function useRoomAllocations(
  filters: {
    page?: number;
    limit?: number;
    activeOnly?: boolean;
    blockId?: number;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });
  if (filters.activeOnly) params.set('activeOnly', 'true');
  if (filters.blockId) params.set('blockId', String(filters.blockId));

  return useQuery({
    queryKey: hostelKeys.allocations(filters),
    queryFn: () => apiFetchPaginated<RoomAllocation>(`/hostel/allocations?${params}`),
  });
}

export function useHostelDailyReport(date: string, blockId?: number) {
  const params = new URLSearchParams({ date });
  if (blockId) params.set('blockId', String(blockId));
  return useQuery({
    queryKey: hostelKeys.dailyReport(date, blockId),
    queryFn: () => apiFetch<HostelDailyReport>(`/hostel/reports/daily?${params}`),
    enabled: Boolean(date),
  });
}

export function useHostelOccupancyReport(blockId?: number) {
  const params = blockId ? `?blockId=${blockId}` : '';
  return useQuery({
    queryKey: hostelKeys.occupancyReport(blockId),
    queryFn: () => apiFetch<HostelOccupancyReport>(`/hostel/reports/occupancy${params}`),
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
    mutationFn: (body: { studentId: string; bedId: number; allocatedFrom: string; notes?: string }) =>
      apiFetch<RoomAllocation>('/hostel/allocations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: hostelKeys.all }),
  });
}

export function useTransferAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      studentId: string;
      bedId: number;
      transferDate: string;
      notes?: string;
    }) =>
      apiFetch<RoomAllocation>('/hostel/allocations/transfer', {
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

export function useHostelAttendanceSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: [...hostelKeys.attendance, 'session', sessionId ?? ''],
    queryFn: () => apiFetch<HostelAttendanceSession>(`/hostel-attendance/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hostelKeys.attendance });
      void qc.invalidateQueries({ queryKey: hostelKeys.overview });
    },
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hostelKeys.sessionRecords(sessionId) });
      void qc.invalidateQueries({ queryKey: hostelKeys.overview });
    },
  });
}
