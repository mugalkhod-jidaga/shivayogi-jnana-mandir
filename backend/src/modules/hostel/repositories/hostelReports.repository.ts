import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { hostelBedRepository } from './hostelBed.repository';

type DailyRecordRow = {
  student_id: string;
  status_id: number;
  lookup_hostel_attendance_statuses: { value: string; counts_as_present: boolean };
  students: {
    id: string;
    first_name: string;
    last_name: string | null;
    admission_number: string;
  };
};

function dateRange(endDate: string, days: number): string[] {
  const end = new Date(`${endDate}T12:00:00`);
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

class HostelReportsRepository {
  async getAttendanceTrend(tenantId: number, endDate: string, days: number, blockId?: number) {
    const dates = dateRange(endDate, days);
    const points = await Promise.all(
      dates.map(async (date) => {
        const report = await this.getDailyReport(tenantId, date, blockId);
        return {
          date,
          hasSession: report.hasSession,
          present: report.totals.present,
          absent: report.totals.absent,
          notMarked: report.totals.notMarked,
          roster: report.totals.roster,
        };
      }),
    );

    return {
      endDate,
      days,
      blockId: blockId ?? null,
      points,
    };
  }

  async getDailyReport(tenantId: number, date: string, blockId?: number) {
    let sessionQuery = supabase
      .from('hostel_attendance_sessions')
      .select('id, block_id')
      .eq('tenant_id', tenantId)
      .eq('attendance_date', date)
      .is('deleted_at', null);

    if (blockId) sessionQuery = sessionQuery.eq('block_id', blockId);

    const { data: sessions, error: sessionError } = await sessionQuery;
    if (sessionError) throw new AppError(500, sessionError.message);

    const sessionIds = (sessions ?? []).map((s) => s.id);

    let rosterQuery = supabase
      .from('room_allocations')
      .select(
        `
        student_id,
        students!inner ( id, first_name, last_name, admission_number ),
        hostel_rooms!inner ( room_number, block_id, hostel_blocks!inner ( id, name ) ),
        hostel_beds ( slot_number )
      `,
      )
      .eq('tenant_id', tenantId)
      .is('allocated_to', null)
      .is('deleted_at', null);

    if (blockId) rosterQuery = rosterQuery.eq('hostel_rooms.block_id', blockId);

    const { data: roster, error: rosterError } = await rosterQuery;
    if (rosterError) throw new AppError(500, rosterError.message);

    const rosterStudentIds = new Set((roster ?? []).map((r) => r.student_id as string));

    let records: DailyRecordRow[] = [];
    if (sessionIds.length > 0) {
      const { data, error } = await supabase
        .from('hostel_attendance_records')
        .select(
          `
          student_id, status_id,
          lookup_hostel_attendance_statuses!inner ( value, counts_as_present ),
          students!inner ( id, first_name, last_name, admission_number )
        `,
        )
        .eq('tenant_id', tenantId)
        .in('session_id', sessionIds)
        .is('deleted_at', null);

      if (error) throw new AppError(500, error.message);
      records = (data ?? []) as unknown as DailyRecordRow[];
    }

    type StudentRow = {
      studentId: string;
      firstName: string;
      lastName: string | null;
      admissionNumber: string;
      blockName: string;
      roomNumber: string;
      bedSlot: number | null;
      status: string | null;
      countsAsPresent: boolean | null;
    };

    const rosterMap = new Map<string, StudentRow>();
    for (const row of roster ?? []) {
      const student = row.students as unknown as {
        id: string;
        first_name: string;
        last_name: string | null;
        admission_number: string;
      };
      const room = row.hostel_rooms as unknown as {
        room_number: string;
        hostel_blocks: { name: string };
      };
      const bed = row.hostel_beds as unknown as { slot_number: number } | null;
      rosterMap.set(row.student_id as string, {
        studentId: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        admissionNumber: student.admission_number,
        blockName: room.hostel_blocks.name,
        roomNumber: room.room_number,
        bedSlot: bed?.slot_number ?? null,
        status: null,
        countsAsPresent: null,
      });
    }

    for (const rec of records) {
      if (!rosterStudentIds.has(rec.student_id)) continue;
      const entry = rosterMap.get(rec.student_id);
      if (entry) {
        entry.status = rec.lookup_hostel_attendance_statuses.value;
        entry.countsAsPresent = rec.lookup_hostel_attendance_statuses.counts_as_present;
      }
    }

    const all = [...rosterMap.values()];
    const present = all.filter((s) => s.countsAsPresent === true);
    const absent = all.filter((s) => s.countsAsPresent === false);
    const notMarked = all.filter((s) => s.countsAsPresent === null);

    return {
      date,
      blockId: blockId ?? null,
      hasSession: sessionIds.length > 0,
      totals: {
        roster: all.length,
        present: present.length,
        absent: absent.length,
        notMarked: notMarked.length,
      },
      present,
      absent,
      notMarked,
    };
  }

  async getOccupancyReport(tenantId: number, blockId?: number) {
    const summary = await hostelBedRepository.countOccupancy(tenantId, blockId);

    let blocksQuery = supabase
      .from('hostel_blocks')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('name');

    if (blockId) blocksQuery = blocksQuery.eq('id', blockId);

    const { data: blocks, error } = await blocksQuery;
    if (error) throw new AppError(500, error.message);

    const blockStats = [];
    for (const block of blocks ?? []) {
      const occ = await hostelBedRepository.countOccupancy(tenantId, block.id);
      blockStats.push({
        blockId: block.id,
        blockName: block.name,
        ...occ,
      });
    }

    return { summary, blocks: blockStats };
  }

  async countUnallocatedActiveStudents(tenantId: number) {
    const { data: allocated, error: allocError } = await supabase
      .from('room_allocations')
      .select('student_id')
      .eq('tenant_id', tenantId)
      .is('allocated_to', null)
      .is('deleted_at', null);

    if (allocError) throw new AppError(500, allocError.message);

    const allocatedIds = new Set((allocated ?? []).map((r) => r.student_id as string));

    const { data: students, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('tenant_id', tenantId)
      .eq('status', 'Active')
      .is('deleted_at', null)
      .order('admission_number');

    if (error) throw new AppError(500, error.message);

    const unallocated = (students ?? []).filter((s) => !allocatedIds.has(s.id as string));
    return {
      count: unallocated.length,
      students: unallocated.map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        admissionNumber: s.admission_number,
      })),
    };
  }
}

export const hostelReportsRepository = new HostelReportsRepository();
