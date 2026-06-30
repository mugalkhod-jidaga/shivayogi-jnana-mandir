import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { studentsRepository } from '../../students/repositories/students.repository';
import type { RemarkListQuery } from '../schemas/remark.schemas';

type RemarkRow = {
  id: string;
  tenant_id: number;
  student_id: string;
  created_by: string;
  remark_type_id: number;
  category_id: number;
  title: string;
  description: string;
  severity: string | null;
  tags: string[] | null;
  is_flagged: boolean;
  follow_up_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  students: {
    id: string;
    first_name: string;
    last_name: string | null;
    admission_number: string;
  };
  lookup_remark_types: { id: number; value: string };
  lookup_remark_categories: { id: number; value: string };
  creator: { id: string; first_name: string; last_name: string | null };
};

const REMARK_SELECT = `
  id, tenant_id, student_id, created_by, remark_type_id, category_id,
  title, description, severity, tags, is_flagged, follow_up_note, resolved_at,
  created_at, updated_at,
  students!inner ( id, first_name, last_name, admission_number ),
  lookup_remark_types!inner ( id, value ),
  lookup_remark_categories!inner ( id, value ),
  creator:user_profiles!student_remarks_created_by_fkey ( id, first_name, last_name )
`;

function serializeRemark(row: RemarkRow, creatorRole?: string) {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    tags: row.tags ?? [],
    isFlagged: row.is_flagged,
    followUpNote: row.follow_up_note,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    remarkType: { id: row.lookup_remark_types.id, value: row.lookup_remark_types.value },
    category: { id: row.lookup_remark_categories.id, value: row.lookup_remark_categories.value },
    student: {
      id: row.students.id,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
      admissionNumber: row.students.admission_number,
      rollNumber: null,
      standard: null,
      section: null,
    },
    createdBy: {
      id: row.creator.id,
      firstName: row.creator.first_name,
      lastName: row.creator.last_name,
      roleName: creatorRole ?? null,
    },
  };
}

class RemarkRepository extends BaseRepository {
  constructor() {
    super('student_remarks');
  }

  private async scopedStudentIds(
    tenantId: number,
    assignedStandardIds?: number[],
  ): Promise<string[] | undefined> {
    if (assignedStandardIds === undefined) return undefined;
    return studentsRepository.listStudentIdsByStandards(tenantId, assignedStandardIds);
  }

  async list(
    tenantId: number,
    query: RemarkListQuery,
    assignedStandardIds?: number[],
  ) {
    const { page, limit, search, typeId, categoryId, days, studentId } = query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    const scopedIds = await this.scopedStudentIds(tenantId, assignedStandardIds);
    if (scopedIds && scopedIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit: cappedLimit } };
    }

    let dbQuery = supabase
      .from('student_remarks')
      .select(REMARK_SELECT, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .is('students.deleted_at', null);

    if (studentId) dbQuery = dbQuery.eq('student_id', studentId);
    if (scopedIds) dbQuery = dbQuery.in('student_id', scopedIds);
    if (typeId) dbQuery = dbQuery.eq('remark_type_id', typeId);
    if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId);
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      dbQuery = dbQuery.gte('created_at', since.toISOString());
    }
    if (search) {
      dbQuery = dbQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + cappedLimit - 1);

    if (error) throw new AppError(500, error.message);
    return {
      data: (data ?? []) as unknown as RemarkRow[],
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async findById(id: string, tenantId: number) {
    const { data, error } = await supabase
      .from('student_remarks')
      .select(REMARK_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AppError(500, error.message);
    }
    return data as unknown as RemarkRow;
  }

  async create(
    tenantId: number,
    studentId: string,
    createdBy: string,
    input: {
      remark_type_id: number;
      category_id: number;
      title: string;
      description: string;
      severity?: string | null;
      tags?: string[];
      is_flagged?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from('student_remarks')
      .insert({
        tenant_id: tenantId,
        student_id: studentId,
        created_by: createdBy,
        ...input,
      })
      .select('id')
      .single();

    if (error) throw new AppError(500, error.message);
    const row = await this.findById(data.id, tenantId);
    if (!row) throw new AppError(500, 'Failed to load created remark');
    return row;
  }

  async stats(tenantId: number, days: number, assignedStandardIds?: number[]) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const scopedIds = await this.scopedStudentIds(tenantId, assignedStandardIds);
    if (scopedIds && scopedIds.length === 0) {
      return { total: 0, positive: 0, negative: 0, observation: 0 };
    }

    let dbQuery = supabase
      .from('student_remarks')
      .select(`id, lookup_remark_types!inner ( value )`)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('created_at', since.toISOString());

    if (scopedIds) dbQuery = dbQuery.in('student_id', scopedIds);

    const { data, error } = await dbQuery;
    if (error) throw new AppError(500, error.message);

    const rows = (data ?? []) as unknown as Array<{ lookup_remark_types: { value: string } }>;
    let positive = 0;
    let negative = 0;
    let observation = 0;
    for (const row of rows) {
      const type = row.lookup_remark_types.value;
      if (type === 'Positive') positive++;
      else if (type === 'Negative') negative++;
      else if (type === 'Observation') observation++;
    }
    return { total: rows.length, positive, negative, observation };
  }
}

export const remarkRepository = new RemarkRepository();
export { serializeRemark };
