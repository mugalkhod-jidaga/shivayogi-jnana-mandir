import { AppError } from '../../../utils/AppError';
import { lookupRepository } from '../../system/repositories/lookup.repository';
import { studentsRepository } from '../../students/repositories/students.repository';
import { hostelRepository } from '../repositories/hostel.repository';
import { hostelAttendanceRepository } from '../repositories/hostelAttendance.repository';
import type {
  BulkAttendanceRecordInput,
  CreateSessionInput,
  DailyBoardQuery,
  EnsureSessionInput,
  SessionListQuery,
  UpdateSessionInput,
} from '../schemas/hostelAttendance.schemas';
import {
  buildHostelAttendanceRoster,
  countHostelAttendanceRoster,
} from './hostelAttendanceRoster.service';

const PERIODS = ['morning', 'evening'] as const;

export const hostelAttendanceService = {
  listSessions(tenantId: number, query: SessionListQuery) {
    return hostelAttendanceRepository.listSessions(tenantId, query);
  },

  async createSession(tenantId: number, input: CreateSessionInput, userId: string) {
    if (input.blockId) {
      const block = await hostelRepository.findBlockById(input.blockId, tenantId);
      if (!block) throw new AppError(400, 'Invalid block');
    }
    return hostelAttendanceRepository.createSession(tenantId, userId, {
      attendance_date: input.attendanceDate,
      session_period: input.sessionPeriod,
      block_id: input.blockId ?? null,
      notes: input.notes ?? null,
    });
  },

  async ensureSession(tenantId: number, input: EnsureSessionInput, userId: string) {
    const blockId = input.blockId ?? null;
    if (blockId) {
      const block = await hostelRepository.findBlockById(blockId, tenantId);
      if (!block) throw new AppError(400, 'Invalid block');
    }

    const existing = await hostelAttendanceRepository.findSessionByKey(
      tenantId,
      input.attendanceDate,
      input.sessionPeriod,
      blockId,
    );
    if (existing) return existing;

    return hostelAttendanceRepository.createSession(tenantId, userId, {
      attendance_date: input.attendanceDate,
      session_period: input.sessionPeriod,
      block_id: blockId,
      notes: null,
    });
  },

  async getDailyBoard(tenantId: number, query: DailyBoardQuery) {
    const blockId = query.blockId ?? null;
    const rosterCount = await countHostelAttendanceRoster(tenantId, blockId);

    const slots: Record<
      string,
      {
        sessionId: string | null;
        markedCount: number;
        rosterCount: number;
        hasSession: boolean;
      }
    > = {};

    for (const period of PERIODS) {
      const session = await hostelAttendanceRepository.findSessionByKey(
        tenantId,
        query.date,
        period,
        blockId,
      );
      const markedCount = session
        ? await hostelAttendanceRepository.countRecords(session.id, tenantId)
        : 0;
      slots[period] = {
        sessionId: session?.id ?? null,
        markedCount,
        rosterCount,
        hasSession: Boolean(session),
      };
    }

    return { date: query.date, blockId, rosterCount, slots };
  },

  async getSession(id: string, tenantId: number) {
    const session = await hostelAttendanceRepository.findSessionById(id, tenantId);
    if (!session) throw new AppError(404, 'Session not found');
    return session;
  },

  async updateSession(id: string, tenantId: number, input: UpdateSessionInput) {
    const existing = await hostelAttendanceRepository.findSessionById(id, tenantId);
    if (!existing) throw new AppError(404, 'Session not found');
    return hostelAttendanceRepository.updateSession(id, tenantId, {
      notes: input.notes,
    });
  },

  async listRecords(sessionId: string, tenantId: number) {
    await this.getSession(sessionId, tenantId);
    return hostelAttendanceRepository.listRecords(sessionId, tenantId);
  },

  async upsertRecords(
    sessionId: string,
    tenantId: number,
    input: BulkAttendanceRecordInput,
  ) {
    await this.getSession(sessionId, tenantId);

    const statuses = await lookupRepository.listHostelAttendanceStatuses(tenantId);
    const statusIds = new Set(statuses.map((s) => s.id));

    for (const record of input.records) {
      if (!statusIds.has(record.statusId)) {
        throw new AppError(400, `Invalid attendance status: ${record.statusId}`);
      }
      const student = await studentsRepository.findByIdWithRelations(record.studentId, tenantId);
      if (!student) throw new AppError(400, `Invalid student: ${record.studentId}`);
    }

    return hostelAttendanceRepository.upsertRecords(tenantId, sessionId, input.records);
  },

  async getSessionRoster(sessionId: string, tenantId: number) {
    const session = await this.getSession(sessionId, tenantId);
    return buildHostelAttendanceRoster(tenantId, session.blockId);
  },
};
