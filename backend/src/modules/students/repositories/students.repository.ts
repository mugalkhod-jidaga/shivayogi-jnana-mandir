import { supabase } from '../../../config/supabase';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { AppError } from '../../../utils/AppError';
import { auditLogService } from '../../system/services/auditLog.service';
import type { FamilyDetailsInput } from '../schemas/student.schemas';

const STUDENT_SELECT = `
  *,
  blood_group:lookup_blood_groups(id, value),
  admission_category:lookup_admission_categories(id, value),
  family_details:student_family_details(*)
`;

export interface StudentRow {
  id: string;
  tenant_id: number;
  admission_number: string;
  first_name: string;
  last_name: string | null;
  dob: string;
  gender: string;
  photo_url: string | null;
  blood_group_id: number | null;
  admission_category_id: number | null;
  medical_alerts: string | null;
  status: string;
  status_reason: string | null;
  status_changed_at: string | null;
  blood_group?: { id: number; value: string } | null;
  admission_category?: { id: number; value: string } | null;
  family_details?: FamilyDetailsRow | FamilyDetailsRow[] | null;
}

export interface FamilyDetailsRow {
  id: string;
  student_id: string;
  father_name: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  parent_status: string;
  annual_income: number | null;
  primary_contact: string;
  house_details: string | null;
  village_town: string;
  taluk_mandal: string;
  district: string;
  state: string;
  pincode: string;
}

function mapFamilyToDb(input: FamilyDetailsInput) {
  return {
    father_name: input.fatherName ?? null,
    mother_name: input.motherName ?? null,
    guardian_name: input.guardianName ?? null,
    parent_status: input.parentStatus,
    annual_income: input.annualIncome ?? null,
    primary_contact: input.primaryContact,
    house_details: input.houseDetails ?? null,
    village_town: input.villageTown,
    taluk_mandal: input.talukMandal,
    district: input.district,
    state: input.state ?? 'Karnataka',
    pincode: input.pincode,
  };
}

function unwrapFamily(row: StudentRow): FamilyDetailsRow | null {
  if (!row.family_details) return null;
  if (Array.isArray(row.family_details)) return row.family_details[0] ?? null;
  return row.family_details;
}

export class StudentsRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  async list(tenantId: number, page: number, limit: number, search?: string) {
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    let query = supabase
      .from('students')
      .select(
        `*, blood_group:lookup_blood_groups(id, value), admission_category:lookup_admission_categories(id, value)`,
        { count: 'exact' },
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await query
      .order('admission_number')
      .range(offset, offset + cappedLimit - 1);

    if (error) throw new AppError(500, error.message);
    return { data: (data ?? []) as StudentRow[], meta: { total: count ?? 0, page, limit: cappedLimit } };
  }

  async findByIdWithRelations(id: string, tenantId: number): Promise<StudentRow | null> {
    const { data, error } = await supabase
      .from('students')
      .select(STUDENT_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AppError(500, error.message);
    }

    return data as StudentRow;
  }

  async create(
    tenantId: number,
    student: Record<string, unknown>,
    family: FamilyDetailsInput,
    userId: string,
  ): Promise<StudentRow> {
    const { data: created, error } = await supabase
      .from('students')
      .insert({
        ...student,
        tenant_id: tenantId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Admission number already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    const { error: familyError } = await supabase
      .from('student_family_details')
      .insert({ student_id: created.id, ...mapFamilyToDb(family) });

    if (familyError) {
      await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', created.id);
      throw new AppError(500, `Failed to create family details: ${familyError.message}`);
    }

    const full = await this.findByIdWithRelations(created.id, tenantId);
    if (!full) throw new AppError(500, 'Failed to load created student');
    return full;
  }

  async updateFamilyDetails(studentId: string, family: Partial<FamilyDetailsInput>) {
    const dbChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (family.fatherName !== undefined) dbChanges.father_name = family.fatherName;
    if (family.motherName !== undefined) dbChanges.mother_name = family.motherName;
    if (family.guardianName !== undefined) dbChanges.guardian_name = family.guardianName;
    if (family.parentStatus !== undefined) dbChanges.parent_status = family.parentStatus;
    if (family.annualIncome !== undefined) dbChanges.annual_income = family.annualIncome;
    if (family.primaryContact !== undefined) dbChanges.primary_contact = family.primaryContact;
    if (family.houseDetails !== undefined) dbChanges.house_details = family.houseDetails;
    if (family.villageTown !== undefined) dbChanges.village_town = family.villageTown;
    if (family.talukMandal !== undefined) dbChanges.taluk_mandal = family.talukMandal;
    if (family.district !== undefined) dbChanges.district = family.district;
    if (family.state !== undefined) dbChanges.state = family.state;
    if (family.pincode !== undefined) dbChanges.pincode = family.pincode;

    const { error } = await supabase
      .from('student_family_details')
      .update(dbChanges)
      .eq('student_id', studentId);

    if (error) throw new AppError(500, error.message);
  }

  async deactivate(
    id: string,
    tenantId: number,
    userId: string,
    status: 'Alumni' | 'Discontinued',
    statusReason: string,
  ) {
    const { data: before } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!before) throw new AppError(404, 'Student not found');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('students')
      .update({
        status,
        status_reason: statusReason,
        status_changed_at: now,
        deleted_at: now,
        updated_at: now,
        updated_by: userId,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(STUDENT_SELECT)
      .single();

    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, 'students', id, 'soft_delete', {
      before,
      after: data,
    });

    return data as StudentRow;
  }
}

export const studentsRepository = new StudentsRepository();
export { unwrapFamily };
