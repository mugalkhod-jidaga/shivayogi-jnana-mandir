import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import type { BulkAttendanceRecordInput, SessionListQuery } from '../schemas/hostelAttendance.schemas';

type SessionRow = {
  id: string;
  tenant_id: number;
  attendance_date: string;
  block_id: number | null;
  session_period: string;
  taken_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  hostel_blocks: { id: number; name: string } | null;
  taker: { id: string; first_name: string; last_name: string | null };
};

type RecordRow = {
  id: string;
  session_id: string;
  student_id: string;
  status_id: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  students: {
    id: string;
    first_name: string;
    last_name: string | null;
    admission_number: string;
  };
  lookup_hostel_attendance_statuses: {
    id: number;
    value: string;
    counts_as_present: boolean;
  };
};

const SESSION_SELECT = `
  id, tenant_id, attendance_date, block_id, session_period, taken_by, notes, created_at, updated_at,
  hostel_blocks ( id, name ),
  taker:user_profiles!hostel_attendance_sessions_taken_by_fkey ( id, first_name, last_name )
`;

const RECORD_SELECT = `
  id, session_id, student_id, status_id, notes, created_at, updated_at,
  students!inner ( id, first_name, last_name, admission_number ),
  lookup_hostel_attendance_statuses!inner ( id, value, counts_as_present )
`;

function serializeSession(row: SessionRow) {
  return {
    id: row.id,
    attendanceDate: row.attendance_date,
    blockId: row.block_id,
    sessionPeriod: row.session_period as 'morning' | 'evening',
    block: row.hostel_blocks,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    takenBy: {
      id: row.taker.id,
      firstName: row.taker.first_name,
      lastName: row.taker.last_name,
    },
  };
}

function serializeRecord(row: RecordRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    studentId: row.student_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    student: {
      id: row.students.id,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
      admissionNumber: row.students.admission_number,
    },
    status: {
      id: row.lookup_hostel_attendance_statuses.id,
      value: row.lookup_hostel_attendance_statuses.value,
      countsAsPresent: row.lookup_hostel_attendance_statuses.counts_as_present,
    },
  };
}

class HostelAttendanceRepository {
  async listSessions(tenantId: number, query: SessionListQuery) {
    const { page, limit, search, attendanceDate, sessionPeriod, blockId } = query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    let dbQuery = supabase
      .from('hostel_attendance_sessions')
      .select(SESSION_SELECT, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('attendance_date', { ascending: false });

    if (attendanceDate) dbQuery = dbQuery.eq('attendance_date', attendanceDate);
    if (sessionPeriod) dbQuery = dbQuery.eq('session_period', sessionPeriod);
    if (blockId) dbQuery = dbQuery.eq('block_id', blockId);
    if (search) dbQuery = dbQuery.ilike('notes', `%${search}%`);

    const { data, count, error } = await dbQuery.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);
    return {
      data: (data ?? []).map((row) => serializeSession(row as unknown as SessionRow)),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async createSession(
    tenantId: number,
    userId: string,
    payload: {
      attendance_date: string;
      session_period: string;
      block_id?: number | null;
      notes?: string | null;
    },
  ) {
    const { data, error } = await supabase
      .from('hostel_attendance_sessions')
      .insert({
        tenant_id: tenantId,
        taken_by: userId,
        ...payload,
      })
      .select(SESSION_SELECT)
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Attendance session already exists for this date, period, and block');
      }
      throw new AppError(500, error.message);
    }
    return serializeSession(data as unknown as SessionRow);
  }

  async findSessionByKey(
    tenantId: number,
    attendanceDate: string,
    sessionPeriod: string,
    blockId: number | null,
  ) {
    let dbQuery = supabase
      .from('hostel_attendance_sessions')
      .select(SESSION_SELECT)
      .eq('tenant_id', tenantId)
      .eq('attendance_date', attendanceDate)
      .eq('session_period', sessionPeriod)
      .is('deleted_at', null);

    if (blockId == null) dbQuery = dbQuery.is('block_id', null);
    else dbQuery = dbQuery.eq('block_id', blockId);

    const { data, error } = await dbQuery.maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeSession(data as unknown as SessionRow) : null;
  }

  async countRecords(sessionId: string, tenantId: number) {
    const { count, error } = await supabase
      .from('hostel_attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('session_id', sessionId)
      .is('deleted_at', null);
    if (error) throw new AppError(500, error.message);
    return count ?? 0;
  }

  async findSessionById(id: string, tenantId: number) {
    const { data, error } = await supabase
      .from('hostel_attendance_sessions')
      .select(SESSION_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeSession(data as unknown as SessionRow) : null;
  }

  async updateSession(id: string, tenantId: number, changes: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('hostel_attendance_sessions')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(SESSION_SELECT)
      .single();
    if (error) throw new AppError(500, error.message);
    return serializeSession(data as unknown as SessionRow);
  }

  async listRecords(sessionId: string, tenantId: number) {
    const { data, error } = await supabase
      .from('hostel_attendance_records')
      .select(RECORD_SELECT)
      .eq('tenant_id', tenantId)
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .order('created_at');
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeRecord(row as unknown as RecordRow));
  }

  async upsertRecords(
    tenantId: number,
    sessionId: string,
    records: BulkAttendanceRecordInput['records'],
  ) {
    const rows = records.map((r) => ({
      tenant_id: tenantId,
      session_id: sessionId,
      student_id: r.studentId,
      status_id: r.statusId,
      notes: r.notes ?? null,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('hostel_attendance_records')
      .upsert(rows, { onConflict: 'session_id,student_id' })
      .select(RECORD_SELECT);
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeRecord(row as unknown as RecordRow));
  }
}

export const hostelAttendanceRepository = new HostelAttendanceRepository();
