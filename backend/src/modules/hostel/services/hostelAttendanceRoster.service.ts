import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { hostelRepository } from './hostel.repository';
import { hostelReportsRepository } from './hostelReports.repository';
import type { SessionPeriod } from '../schemas/hostelAttendance.schemas';

export type HostelAttendanceRosterRow = {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNumber: string;
  isAssigned: boolean;
  blockName: string | null;
  roomNumber: string | null;
  bedSlot: number | null;
  bedLabel: string | null;
};

export async function buildHostelAttendanceRoster(
  tenantId: number,
  blockId: number | null,
): Promise<HostelAttendanceRosterRow[]> {
  const allocated = await hostelRepository.listAllocationsForBlock(tenantId, blockId);

  const rows: HostelAttendanceRosterRow[] = allocated.map((a) => ({
    studentId: a.studentId,
    firstName: a.student.firstName,
    lastName: a.student.lastName,
    admissionNumber: a.student.admissionNumber,
    isAssigned: true,
    blockName: a.room.block.name,
    roomNumber: a.room.roomNumber,
    bedSlot: a.bed?.slotNumber ?? null,
    bedLabel: a.bed?.bedLabel ?? a.student.admissionNumber,
  }));

  if (!blockId) {
    const { students } = await hostelReportsRepository.countUnallocatedActiveStudents(tenantId);
    for (const s of students) {
      rows.push({
        studentId: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        admissionNumber: s.admissionNumber,
        isAssigned: false,
        blockName: null,
        roomNumber: null,
        bedSlot: null,
        bedLabel: null,
      });
    }
  }

  return rows.sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber));
}

export async function countHostelAttendanceRoster(
  tenantId: number,
  blockId: number | null,
): Promise<number> {
  const roster = await buildHostelAttendanceRoster(tenantId, blockId);
  return roster.length;
}
