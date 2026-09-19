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
  standardId: number | null;
  sectionId: number | null;
};

async function filterByEnrollment(
  rows: HostelAttendanceRosterRow[],
  standardId?: number | null,
  sectionId?: number | null,
): Promise<HostelAttendanceRosterRow[]> {
  // Always scope to current-year enrollments; optionally narrow by standard/section.
  // Also stamps each row with the student's current standard_id/section_id.
  let q = supabase
    .from('student_enrollments')
    .select('student_id, standard_id, section_id')
    .eq('is_current', true)
    .is('deleted_at', null);

  if (standardId) q = q.eq('standard_id', standardId);
  if (sectionId)  q = q.eq('section_id',  sectionId);

  const { data, error } = await q;
  if (error) throw error;

  const enrollmentMap = new Map(
    (data ?? []).map((r) => [
      r.student_id as string,
      { standardId: r.standard_id as number | null, sectionId: r.section_id as number | null },
    ]),
  );

  return rows
    .filter((r) => enrollmentMap.has(r.studentId))
    .map((r) => ({
      ...r,
      standardId: enrollmentMap.get(r.studentId)!.standardId,
      sectionId:  enrollmentMap.get(r.studentId)!.sectionId,
    }));
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
    standardId: null,
    sectionId: null,
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
        standardId: null,
        sectionId: null,
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
