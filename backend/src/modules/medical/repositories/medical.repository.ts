import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { studentsRepository } from '../../students/repositories/students.repository';
import type { MedicalListQuery } from '../schemas/medical.schemas';

type MedicalRow = {
  id: string;
  tenant_id: number;
  student_id: string;
  record_type_id: number;
  title: string;
  description: string;
  recorded_on: string;
  is_ongoing: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  students: {
    id: string;
    first_name: string;
    last_name: string | null;
    admission_number: string;
  };
  lookup_medical_record_types: { id: number; value: string };
  creator: { id: string; first_name: string; last_name: string | null };
};

const MEDICAL_SELECT = `
  id, tenant_id, student_id, record_type_id, title, description, recorded_on, is_ongoing,
  created_by, created_at, updated_at,
  students!inner ( id, first_name, last_name, admission_number ),
  lookup_medical_record_types!inner ( id, value ),
  creator:user_profiles!student_medical_records_created_by_fkey ( id, first_name, last_name )
`;

function serializeMedical(row: MedicalRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    description: row.description,
    recordedOn: row.recorded_on,
    isOngoing: row.is_ongoing,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recordType: {
      id: row.lookup_medical_record_types.id,
      value: row.lookup_medical_record_types.value,
    },
    student: {
      id: row.students.id,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
      admissionNumber: row.students.admission_number,
    },
    createdBy: {
      id: row.creator.id,
      firstName: row.creator.first_name,
      lastName: row.creator.last_name,
    },
  };
}

class MedicalRepository extends BaseRepository {
  constructor() {
    super('student_medical_records');
  }

  private async scopedStudentIds(
    tenantId: number,
    assignedStandardIds?: number[],
  ): Promise<string[] | undefined> {
    if (assignedStandardIds === undefined) return undefined;
    return studentsRepository.listStudentIdsByStandards(tenantId, assignedStandardIds);
  }

  async list(tenantId: number, query: MedicalListQuery, assignedStandardIds?: number[]) {
    const { page, limit, search, typeId, studentId } = query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    const scopedIds = await this.scopedStudentIds(tenantId, assignedStandardIds);
    if (scopedIds && scopedIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit: cappedLimit } };
    }

    let dbQuery = supabase
      .from('student_medical_records')
      .select(MEDICAL_SELECT, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('recorded_on', { ascending: false });

    if (studentId) dbQuery = dbQuery.eq('student_id', studentId);
    if (scopedIds) dbQuery = dbQuery.in('student_id', scopedIds);
    if (typeId) dbQuery = dbQuery.eq('record_type_id', typeId);
    if (search) {
      dbQuery = dbQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await dbQuery.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);
    return {
      data: (data ?? []).map((row) => serializeMedical(row as unknown as MedicalRow)),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async create(
    tenantId: number,
    studentId: string,
    userId: string,
    payload: {
      record_type_id: number;
      title: string;
      description: string;
      recorded_on: string;
      is_ongoing?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from('student_medical_records')
      .insert({
        tenant_id: tenantId,
        student_id: studentId,
        created_by: userId,
        ...payload,
      })
      .select(MEDICAL_SELECT)
      .single();
    if (error) throw new AppError(500, error.message);
    return serializeMedical(data as unknown as MedicalRow);
  }

  async findById(id: string, tenantId: number) {
    const { data, error } = await supabase
      .from('student_medical_records')
      .select(MEDICAL_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeMedical(data as unknown as MedicalRow) : null;
  }
}

export const medicalRepository = new MedicalRepository();
