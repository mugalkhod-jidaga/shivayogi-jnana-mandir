import { supabase } from '../../../config/supabase';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { AppError } from '../../../utils/AppError';
import { auditLogService } from '../../system/services/auditLog.service';
import type {
  AcademicPlacementInput,
  UpdateAcademicPlacementInput,
  EmergencyContactInput,
  FamilyDetailsInput,
  SocialDetailsInput,
  StudentListQuery,
} from '../schemas/student.schemas';

const ENROLLMENT_SELECT = `
  id, roll_number, previous_school, previous_school_address, last_class_studied, enrolled_at, is_current,
  academic_year_id, standard_id, section_id,
  academic_year:lookup_academic_years(id, label, is_current),
  standard:lookup_academic_standards(id, value, sort_order),
  section:lookup_sections(id, value)
`;

const STUDENT_SELECT = `
  *,
  blood_group:lookup_blood_groups(id, value),
  admission_category:lookup_admission_categories(id, value),
  mother_tongue:lookup_languages(id, value),
  family_details:student_family_details(*),
  social_details:student_social_details(
    id, religion_id, social_category_id, caste, sub_caste, rd_number, rd_number_secondary,
    religion:lookup_religions(id, value),
    social_category:lookup_social_categories(id, value)
  ),
  current_enrollment:student_enrollments!left(
    ${ENROLLMENT_SELECT}
  ),
  emergency_contacts:student_emergency_contacts(id, contact_name, relationship, phone_number)
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
  admission_date: string;
  mother_tongue_id: number | null;
  aadhaar_number: string | null;
  sats_id: string | null;
  sats_transfer_status: string | null;
  status: string;
  status_reason: string | null;
  status_changed_at: string | null;
  health_status?: string | null;
  blood_group?: { id: number; value: string } | null;
  admission_category?: { id: number; value: string } | null;
  mother_tongue?: { id: number; value: string } | null;
  family_details?: FamilyDetailsRow | FamilyDetailsRow[] | null;
  current_enrollment?: EnrollmentRow | EnrollmentRow[] | null;
  emergency_contacts?: EmergencyContactRow[] | null;
  social_details?: SocialDetailsRow | SocialDetailsRow[] | null;
}

export interface SocialDetailsRow {
  id: string;
  religion_id: number | null;
  social_category_id: number | null;
  caste: string | null;
  sub_caste: string | null;
  rd_number: string | null;
  rd_number_secondary: string | null;
  religion?: { id: number; value: string } | null;
  social_category?: { id: number; value: string } | null;
}

export interface EnrollmentRow {
  id: string;
  roll_number: string | null;
  previous_school: string | null;
  previous_school_address: string | null;
  last_class_studied: string | null;
  enrolled_at: string;
  is_current: boolean;
  academic_year_id: number;
  standard_id: number;
  section_id: number | null;
  academic_year?: { id: number; label: string; is_current: boolean } | null;
  standard?: { id: number; value: string; sort_order: number } | null;
  section?: { id: number; value: string } | null;
}

export interface EmergencyContactRow {
  id: string;
  contact_name: string;
  relationship: string;
  phone_number: string;
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

function mapEnrollmentToDb(input: AcademicPlacementInput, admissionDate: string) {
  return {
    academic_year_id: input.academicYearId,
    standard_id: input.standardId,
    section_id: input.sectionId ?? null,
    roll_number: input.rollNumber,
    previous_school: input.previousSchool ?? null,
    previous_school_address: input.previousSchoolAddress ?? null,
    last_class_studied: input.lastClassStudied ?? null,
    is_current: true,
    enrolled_at: input.enrolledAt ?? admissionDate,
  };
}

function mapSocialToDb(input: SocialDetailsInput) {
  return {
    religion_id: input.religionId ?? null,
    social_category_id: input.socialCategoryId ?? null,
    caste: input.caste ?? null,
    sub_caste: input.subCaste ?? null,
    rd_number: input.rdNumber ?? null,
    rd_number_secondary: input.rdNumberSecondary ?? null,
  };
}

function unwrapSocial(row: StudentRow): SocialDetailsRow | null {
  if (!row.social_details) return null;
  if (Array.isArray(row.social_details)) return row.social_details[0] ?? null;
  return row.social_details;
}

function unwrapFamily(row: StudentRow): FamilyDetailsRow | null {
  if (!row.family_details) return null;
  if (Array.isArray(row.family_details)) return row.family_details[0] ?? null;
  return row.family_details;
}

function unwrapEnrollment(row: StudentRow): EnrollmentRow | null {
  if (!row.current_enrollment) return null;
  const enrollments = Array.isArray(row.current_enrollment)
    ? row.current_enrollment
    : [row.current_enrollment];
  return enrollments.find((e) => e.is_current) ?? enrollments[0] ?? null;
}

function listSelect(useInnerEnrollment: boolean) {
  const join = useInnerEnrollment ? 'student_enrollments!inner' : 'student_enrollments!left';
  return `
    *,
    blood_group:lookup_blood_groups(id, value),
    admission_category:lookup_admission_categories(id, value),
    mother_tongue:lookup_languages(id, value),
    current_enrollment:${join}(
      ${ENROLLMENT_SELECT}
    )
  `;
}

export class StudentsRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  async list(tenantId: number, query: StudentListQuery, assignedStandardIds?: number[]) {
    const { page, limit, search, status, standardId, sectionId, academicYearId, admissionCategoryId } =
      query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    const needsEnrollmentJoin = Boolean(
      standardId || sectionId || academicYearId || (assignedStandardIds && assignedStandardIds.length > 0),
    );

    let dbQuery = supabase
      .from('students')
      .select(listSelect(needsEnrollmentJoin), { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (needsEnrollmentJoin) {
      dbQuery = dbQuery
        .eq('current_enrollment.is_current', true)
        .is('current_enrollment.deleted_at', null);
    }

    if (search) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`,
      );
    }

    if (status) dbQuery = dbQuery.eq('status', status);
    if (admissionCategoryId) dbQuery = dbQuery.eq('admission_category_id', admissionCategoryId);
    if (standardId) dbQuery = dbQuery.eq('current_enrollment.standard_id', standardId);
    if (sectionId) dbQuery = dbQuery.eq('current_enrollment.section_id', sectionId);
    if (academicYearId) dbQuery = dbQuery.eq('current_enrollment.academic_year_id', academicYearId);

    if (assignedStandardIds && assignedStandardIds.length > 0) {
      dbQuery = dbQuery.in('current_enrollment.standard_id', assignedStandardIds);
    } else if (assignedStandardIds && assignedStandardIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit: cappedLimit } };
    }

    const { data, count, error } = await dbQuery
      .order('admission_number')
      .range(offset, offset + cappedLimit - 1);

    if (error) throw new AppError(500, error.message);
    return { data: (data ?? []) as unknown as StudentRow[], meta: { total: count ?? 0, page, limit: cappedLimit } };
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

    const row = data as StudentRow;
    if (row.emergency_contacts) {
      row.emergency_contacts = row.emergency_contacts.filter(
        (c) => !(c as EmergencyContactRow & { deleted_at?: string | null }).deleted_at,
      );
    }

    return row;
  }

  async peekNextAdmissionNumber(tenantId: number): Promise<string> {
    const { data, error } = await supabase
      .from('tenant_admission_sequences')
      .select('prefix, next_number')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw new AppError(500, error.message);

    const prefix = data?.prefix ?? 'SJM';
    const nextNumber = data?.next_number ?? 1;
    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  async allocateAdmissionNumber(tenantId: number): Promise<string> {
    const { data, error } = await supabase.rpc('allocate_admission_number', {
      p_tenant_id: tenantId,
    });

    if (error) throw new AppError(500, error.message);
    if (!data || typeof data !== 'string') {
      throw new AppError(500, 'Failed to allocate admission number');
    }
    return data;
  }

  async create(
    tenantId: number,
    student: Record<string, unknown>,
    family: FamilyDetailsInput,
    enrollment: AcademicPlacementInput,
    emergencyContacts: EmergencyContactInput[],
    admissionDate: string,
    userId: string,
    socialDetails?: SocialDetailsInput,
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
        throw new AppError(409, 'Admission number or Aadhaar already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    const studentId = created.id as string;

    const { error: familyError } = await supabase
      .from('student_family_details')
      .insert({ student_id: studentId, ...mapFamilyToDb(family) });

    if (familyError) {
      await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', studentId);
      throw new AppError(500, `Failed to create family details: ${familyError.message}`);
    }

    const { error: enrollmentError } = await supabase
      .from('student_enrollments')
      .insert({ student_id: studentId, ...mapEnrollmentToDb(enrollment, admissionDate) });

    if (enrollmentError) {
      await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', studentId);
      throw new AppError(500, `Failed to create enrollment: ${enrollmentError.message}`);
    }

    const contactRows = emergencyContacts.map((c) => ({
      student_id: studentId,
      contact_name: c.contactName,
      relationship: c.relationship,
      phone_number: c.phone,
    }));

    const { error: contactsError } = await supabase.from('student_emergency_contacts').insert(contactRows);

    if (contactsError) {
      await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', studentId);
      throw new AppError(500, `Failed to create emergency contacts: ${contactsError.message}`);
    }

    if (socialDetails) {
      const { error: socialError } = await supabase
        .from('student_social_details')
        .insert({ student_id: studentId, ...mapSocialToDb(socialDetails) });

      if (socialError) {
        await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', studentId);
        throw new AppError(500, `Failed to create social details: ${socialError.message}`);
      }
    }

    const full = await this.findByIdWithRelations(studentId, tenantId);
    if (!full) throw new AppError(500, 'Failed to load created student');
    return full;
  }

  async updateEnrollment(
    studentId: string,
    changes: UpdateAcademicPlacementInput,
    admissionDate?: string,
  ) {
    const enrollment = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_current', true)
      .is('deleted_at', null)
      .single();

    if (enrollment.error || !enrollment.data) {
      throw new AppError(404, 'Current enrollment not found');
    }

    const dbChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (changes.academicYearId !== undefined) dbChanges.academic_year_id = changes.academicYearId;
    if (changes.standardId !== undefined) dbChanges.standard_id = changes.standardId;
    if (changes.sectionId !== undefined) dbChanges.section_id = changes.sectionId;
    if (changes.rollNumber !== undefined) dbChanges.roll_number = changes.rollNumber;
    if (changes.previousSchool !== undefined) dbChanges.previous_school = changes.previousSchool;
    if (changes.previousSchoolAddress !== undefined) {
      dbChanges.previous_school_address = changes.previousSchoolAddress;
    }
    if (changes.lastClassStudied !== undefined) dbChanges.last_class_studied = changes.lastClassStudied;
    if (changes.enrolledAt !== undefined) dbChanges.enrolled_at = changes.enrolledAt;
    else if (admissionDate !== undefined) dbChanges.enrolled_at = admissionDate;

    const { error } = await supabase
      .from('student_enrollments')
      .update(dbChanges)
      .eq('id', enrollment.data.id);

    if (error) throw new AppError(500, error.message);
  }

  async updateSocialDetails(studentId: string, social: Partial<SocialDetailsInput>) {
    const dbChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (social.religionId !== undefined) dbChanges.religion_id = social.religionId;
    if (social.socialCategoryId !== undefined) dbChanges.social_category_id = social.socialCategoryId;
    if (social.caste !== undefined) dbChanges.caste = social.caste;
    if (social.subCaste !== undefined) dbChanges.sub_caste = social.subCaste;
    if (social.rdNumber !== undefined) dbChanges.rd_number = social.rdNumber;
    if (social.rdNumberSecondary !== undefined) dbChanges.rd_number_secondary = social.rdNumberSecondary;

    const { error } = await supabase
      .from('student_social_details')
      .update(dbChanges)
      .eq('student_id', studentId);

    if (error) throw new AppError(500, error.message);
  }

  async replaceEmergencyContacts(studentId: string, contacts: EmergencyContactInput[]) {
    const now = new Date().toISOString();
    const { error: softDeleteError } = await supabase
      .from('student_emergency_contacts')
      .update({ deleted_at: now, updated_at: now })
      .eq('student_id', studentId)
      .is('deleted_at', null);

    if (softDeleteError) throw new AppError(500, softDeleteError.message);

    const rows = contacts.map((c) => ({
      student_id: studentId,
      contact_name: c.contactName,
      relationship: c.relationship,
      phone_number: c.phone,
    }));

    const { error } = await supabase.from('student_emergency_contacts').insert(rows);
    if (error) throw new AppError(500, error.message);
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

  async getAssignedStandardIds(userId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('user_standard_assignments')
      .select('standard_id')
      .eq('user_id', userId);

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => row.standard_id as number);
  }

  async listStudentIdsByStandards(tenantId: number, standardIds: number[]): Promise<string[]> {
    if (standardIds.length === 0) return [];

    const { data, error } = await supabase
      .from('student_enrollments')
      .select('student_id, students!inner(tenant_id, deleted_at)')
      .eq('is_current', true)
      .is('deleted_at', null)
      .in('standard_id', standardIds)
      .eq('students.tenant_id', tenantId)
      .is('students.deleted_at', null);

    if (error) throw new AppError(500, error.message);
    const ids = new Set((data ?? []).map((row) => row.student_id as string));
    return [...ids];
  }

  async setAssignedStandardIds(userId: string, standardIds: number[]) {
    const { error: deleteError } = await supabase
      .from('user_standard_assignments')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw new AppError(500, deleteError.message);

    if (standardIds.length === 0) return;

    const rows = standardIds.map((standardId) => ({ user_id: userId, standard_id: standardId }));
    const { error } = await supabase.from('user_standard_assignments').insert(rows);
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
        updated_at: now,
        updated_by: userId,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select(STUDENT_SELECT)
      .single();

    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, 'students', id, 'update', {
      before,
      after: data,
      metadata: { action: 'deactivate', status, statusReason },
    });

    return data as StudentRow;
  }
}

export const studentsRepository = new StudentsRepository();
export { unwrapFamily, unwrapEnrollment, unwrapSocial };
