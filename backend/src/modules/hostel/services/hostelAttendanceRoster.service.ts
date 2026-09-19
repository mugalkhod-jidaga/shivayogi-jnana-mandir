import { supabase } from '../../../config/supabase';
import { hostelRepository } from '../repositories/hostel.repository';
import { hostelReportsRepository } from '../repositories/hostelReports.repository';

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

async function filterByEnrollment(
  rows: HostelAttendanceRosterRow[],
  standardId?: number | null,
  sectionId?: number | null,
): Promise<HostelAttendanceRosterRow[]> {
  // Always scope to current-year enrollments; optionally narrow by standard/section.
  let q = supabase
    .from('student_enrollments')
    .select('student_id')
    .eq('is_current', true)
    .is('deleted_at', null);

  if (standardId) q = q.eq('standard_id', standardId);
  if (sectionId)  q = q.eq('section_id',  sectionId);

  const { data, error } = await q;
  if (error) throw error;

  const ids = new Set((data ?? []).map((r) => r.student_id as string));
  return rows.filter((r) => ids.has(r.studentId));
}

export async function buildHostelAttendanceRoster(
  tenantId: number,
  blockId: number | null,
  standardId?: number | null,
  sectionId?: number | null,
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

  const filtered = await filterByEnrollment(rows, standardId, sectionId);
  return filtered.sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber));
}

export async function countHostelAttendanceRoster(
  tenantId: number,
  blockId: number | null,
  standardId?: number | null,
  sectionId?: number | null,
): Promise<number> {
  const roster = await buildHostelAttendanceRoster(tenantId, blockId, standardId, sectionId);
  return roster.length;
}
