import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { usersRepository } from '../../auth/repositories/users.repository';
import { getDownloadUrl, getUploadUrl } from '../../documents/services/presignedUrl.service';
import type {
  AcademicPlacementInput,
  CreateStudentInput,
  DeactivateStudentInput,
  EmergencyContactInput,
  EnrollmentStatsQuery,
  PromoteStudentsInput,
  StudentListQuery,
  UpdateAcademicPlacementInput,
  UpdateStudentInput,
} from '../schemas/student.schemas';
import {
  studentsRepository,
  unwrapEnrollment,
  unwrapFamily,
  unwrapSocial,
  type EmergencyContactRow,
  type EnrollmentRow,
  type FamilyDetailsRow,
  type SocialDetailsRow,
  type StudentRow,
} from '../repositories/students.repository';

const FULL_ACCESS_ROLES = new Set(['Super Admin', 'Admissions Clerk', 'Finance']);

const ENROLLMENT_TYPES = ['NEW', 'PROMOTED', 'REPEATED', 'TRANSFERRED'] as const;
type EnrollmentTypeCounts = Record<(typeof ENROLLMENT_TYPES)[number], number>;

function emptyEnrollmentTypeCounts(): EnrollmentTypeCounts {
  return { NEW: 0, PROMOTED: 0, REPEATED: 0, TRANSFERRED: 0 };
}

type GeoField = 'district' | 'taluk_mandal' | 'village_town';

function aggregateGeoField(
  rows: Array<Record<GeoField, string>>,
  field: GeoField,
) {
  const map = new Map<string, { label: string; count: number }>();
  for (const row of rows) {
    const raw = row[field]?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { label: raw, count: 1 });
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function serializeFamily(family: FamilyDetailsRow) {
  return {
    fatherName: family.father_name,
    motherName: family.mother_name,
    guardianName: family.guardian_name,
    parentStatus: family.parent_status,
    annualIncome: family.annual_income,
    primaryContact: family.primary_contact,
    houseDetails: family.house_details,
    villageTown: family.village_town,
    talukMandal: family.taluk_mandal,
    district: family.district,
    state: family.state,
    pincode: family.pincode,
  };
}

function serializeEnrollment(enrollment: EnrollmentRow) {
  const academicYear = enrollment.academic_year;
  return {
    id: enrollment.id,
    rollNumber: enrollment.roll_number,
    previousSchool: enrollment.previous_school,
    previousSchoolAddress: enrollment.previous_school_address,
    lastClassStudied: enrollment.last_class_studied,
    enrolledAt: enrollment.enrolled_at,
    academicYear: academicYear
      ? { id: academicYear.id, value: academicYear.label, isCurrent: academicYear.is_current }
      : null,
    standard: enrollment.standard ?? null,
    section: enrollment.section ?? null,
  };
}

function serializeSocial(social: SocialDetailsRow) {
  return {
    religion: social.religion ?? null,
    socialCategory: social.social_category ?? null,
    caste: social.caste,
    subCaste: social.sub_caste,
    rdNumber: social.rd_number,
    rdNumberSecondary: social.rd_number_secondary,
  };
}

function serializeEmergencyContact(contact: EmergencyContactRow) {
  return {
    id: contact.id,
    contactName: contact.contact_name,
    relationship: contact.relationship,
    phone: contact.phone_number,
  };
}

function serializeStudent(student: StudentRow, _permissions: string[], includeFamily = true) {
  const enrollment = unwrapEnrollment(student);
  const social = unwrapSocial(student);

  const base = {
    id: student.id,
    admissionNumber: student.admission_number,
    firstName: student.first_name,
    lastName: student.last_name,
    nameEnglish: student.name_english,
    dob: student.dob,
    gender: student.gender,
    photoUrl: student.photo_url,
    bloodGroup: student.blood_group ?? null,
    admissionCategory: student.admission_category ?? null,
    socialCategory: social?.social_category ?? null,
    motherTongue: student.mother_tongue ?? null,
    admissionDate: student.admission_date,
    aadhaarNumber: student.aadhaar_number,
    satsId: student.sats_id,
    satsTransferStatus: student.sats_transfer_status,
    currentEnrollment: enrollment ? serializeEnrollment(enrollment) : null,
    emergencyContacts: (student.emergency_contacts ?? []).map(serializeEmergencyContact),
    status: student.status,
    statusReason: student.status_reason,
    statusChangedAt: student.status_changed_at,
    healthStatus: student.health_status ?? 'healthy',
    medicalAlerts: student.medical_alerts,
  };

  if (!includeFamily) {
    return base;
  }

  const family = unwrapFamily(student);
  const socialFull = unwrapSocial(student);
  return {
    ...base,
    familyDetails: family ? serializeFamily(family) : null,
    socialDetails: socialFull ? serializeSocial(socialFull) : null,
  };
}

async function validateBloodGroupId(bloodGroupId: number) {
  const { data, error } = await supabase
    .from('lookup_blood_groups')
    .select('id')
    .eq('id', bloodGroupId)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError(400, 'Invalid blood group');
}

async function validateTenantLookup(
  table: string,
  id: number,
  tenantId: number,
  label: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError(400, `Invalid ${label} for this tenant`);
}

/**
 * Accepts a partial placement (PATCH) too — only validates fields that are
 * actually present, so a same-year edit that only touches e.g. rollNumber
 * doesn't spuriously fail because academicYearId/standardId weren't sent.
 */
async function validateAcademicPlacement(
  tenantId: number,
  placement: AcademicPlacementInput | UpdateAcademicPlacementInput,
) {
  if (placement.academicYearId) {
    await validateTenantLookup('lookup_academic_years', placement.academicYearId, tenantId, 'academic year');
  }
  if (placement.standardId) {
    await validateTenantLookup('lookup_academic_standards', placement.standardId, tenantId, 'standard');
  }
  if (placement.sectionId) {
    await validateTenantLookup('lookup_sections', placement.sectionId, tenantId, 'section');
  }
}

async function resolveStandardScope(userId: string): Promise<number[] | undefined> {
  const roles = await usersRepository.findRoles(userId);
  const roleNames = roles.map((r) => r.name);
  if (roleNames.some((name) => FULL_ACCESS_ROLES.has(name))) {
    return undefined;
  }

  if (roleNames.includes('Teacher/Warden')) {
    return studentsRepository.getAssignedStandardIds(userId);
  }

  return undefined;
}

async function assertStudentStandardAccess(
  student: StudentRow,
  userId: string,
  permissions: string[],
): Promise<void> {
  const assignedStandardIds = await resolveStandardScope(userId);
  if (assignedStandardIds === undefined) return;

  const enrollment = unwrapEnrollment(student);
  if (!enrollment) {
    throw new AppError(403, 'Access denied for this student');
  }

  if (!assignedStandardIds.includes(enrollment.standard_id)) {
    throw new AppError(403, 'Access denied for this student standard');
  }

  void permissions;
}

export const studentService = {
  async getNextAdmissionNumber(tenantId: number) {
    const admissionNumber = await studentsRepository.peekNextAdmissionNumber(tenantId);
    return { admissionNumber };
  },

  async list(tenantId: number, query: StudentListQuery, userId: string, permissions: string[]) {
    const assignedStandardIds = await resolveStandardScope(userId);
    const { data, meta } = await studentsRepository.list(tenantId, query, assignedStandardIds);
    return {
      data: data.map((row) => serializeStudent(row, permissions, false)),
      meta,
    };
  },

  async getById(id: string, tenantId: number, userId: string, permissions: string[]) {
    const student = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!student) throw new AppError(404, 'Student not found');
    await assertStudentStandardAccess(student, userId, permissions);
    return serializeStudent(student, permissions, true);
  },

  async create(tenantId: number, input: CreateStudentInput, userId: string, permissions: string[]) {
    if (input.bloodGroupId) await validateBloodGroupId(input.bloodGroupId);
    if (input.admissionCategoryId) {
      await validateTenantLookup(
        'lookup_admission_categories',
        input.admissionCategoryId,
        tenantId,
        'admission category',
      );
    }
    if (input.motherTongueId) {
      await validateTenantLookup('lookup_languages', input.motherTongueId, tenantId, 'language');
    }
    if (input.socialDetails?.religionId) {
      await validateTenantLookup('lookup_religions', input.socialDetails.religionId, tenantId, 'religion');
    }
    if (input.socialDetails?.socialCategoryId) {
      await validateTenantLookup(
        'lookup_social_categories',
        input.socialDetails.socialCategoryId,
        tenantId,
        'social category',
      );
    }
    await validateAcademicPlacement(tenantId, input.academicPlacement);

    const admissionNumber =
      input.admissionNumber ?? (await studentsRepository.allocateAdmissionNumber(tenantId));

    const student = await studentsRepository.create(
      tenantId,
      {
        admission_number: admissionNumber,
        first_name: input.firstName,
        last_name: input.lastName ?? null,
        name_english: input.nameEnglish ?? null,
        dob: input.dob,
        gender: input.gender,
        blood_group_id: input.bloodGroupId ?? null,
        admission_category_id: input.admissionCategoryId ?? null,
        admission_date: input.admissionDate,
        mother_tongue_id: input.motherTongueId ?? null,
        aadhaar_number: input.aadhaarNumber ?? null,
        sats_id: input.satsId ?? null,
        sats_transfer_status: input.satsTransferStatus ?? (input.satsId ? 'Transferred' : 'Pending'),
      },
      input.familyDetails,
      input.academicPlacement,
      input.emergencyContacts,
      input.admissionDate,
      userId,
      input.socialDetails,
    );

    return serializeStudent(student, permissions, true);
  },

  async update(
    id: string,
    tenantId: number,
    input: UpdateStudentInput,
    userId: string,
    permissions: string[],
  ) {
    const existing = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!existing) throw new AppError(404, 'Student not found');
    await assertStudentStandardAccess(existing, userId, permissions);

    if (input.bloodGroupId) await validateBloodGroupId(input.bloodGroupId);
    if (input.admissionCategoryId) {
      await validateTenantLookup(
        'lookup_admission_categories',
        input.admissionCategoryId,
        tenantId,
        'admission category',
      );
    }
    if (input.motherTongueId) {
      await validateTenantLookup('lookup_languages', input.motherTongueId, tenantId, 'language');
    }
    if (input.academicPlacement) {
      await validateAcademicPlacement(tenantId, input.academicPlacement);
    }

    const changes: Record<string, unknown> = { updated_by: userId };
    if (input.firstName !== undefined) changes.first_name = input.firstName;
    if (input.lastName !== undefined) changes.last_name = input.lastName;
    if (input.nameEnglish !== undefined) changes.name_english = input.nameEnglish;
    if (input.dob !== undefined) changes.dob = input.dob;
    if (input.gender !== undefined) changes.gender = input.gender;
    if (input.bloodGroupId !== undefined) changes.blood_group_id = input.bloodGroupId;
    if (input.admissionCategoryId !== undefined) changes.admission_category_id = input.admissionCategoryId;
    if (input.admissionDate !== undefined) changes.admission_date = input.admissionDate;
    if (input.motherTongueId !== undefined) changes.mother_tongue_id = input.motherTongueId;
    if (input.aadhaarNumber !== undefined) changes.aadhaar_number = input.aadhaarNumber;
    if (input.satsId !== undefined) changes.sats_id = input.satsId;
    if (input.satsTransferStatus !== undefined) changes.sats_transfer_status = input.satsTransferStatus;

    if (input.status !== undefined) {
      changes.status = input.status;
      changes.status_changed_at = new Date().toISOString();
      if (input.statusReason !== undefined) changes.status_reason = input.statusReason;
    } else if (input.statusReason !== undefined) {
      changes.status_reason = input.statusReason;
      changes.status_changed_at = new Date().toISOString();
    }

    if (Object.keys(changes).length > 1) {
      await studentsRepository.update(id, tenantId, changes, userId);
    }

    if (input.academicPlacement) {
      await studentsRepository.updateEnrollment(id, input.academicPlacement, input.admissionDate);
    }

    if (input.emergencyContacts) {
      await studentsRepository.replaceEmergencyContacts(id, input.emergencyContacts);
    }

    if (input.familyDetails) {
      await studentsRepository.updateFamilyDetails(id, input.familyDetails);
    }

    if (input.socialDetails) {
      await studentsRepository.updateSocialDetails(id, input.socialDetails);
    }

    const updated = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!updated) throw new AppError(404, 'Student not found');
    return serializeStudent(updated, permissions, true);
  },

  async deactivate(
    id: string,
    tenantId: number,
    input: DeactivateStudentInput,
    userId: string,
    permissions: string[],
  ) {
    const existing = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!existing) throw new AppError(404, 'Student not found');
    await assertStudentStandardAccess(existing, userId, permissions);

    const student = await studentsRepository.deactivate(
      id,
      tenantId,
      userId,
      input.status,
      input.statusReason,
    );
    return serializeStudent(student, permissions, true);
  },

  async presignAvatar(id: string, tenantId: number, filename: string, contentType?: string) {
    const student = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!student) throw new AppError(404, 'Student not found');
    return getUploadUrl(tenantId, id, filename, 'avatar', contentType);
  },

  async confirmAvatar(id: string, tenantId: number, key: string, userId: string, permissions: string[]) {
    const expectedPrefix = `tenant_${tenantId}/student_${id}/avatar/`;
    if (!key.startsWith(expectedPrefix)) {
      throw new AppError(400, 'Invalid avatar key for this student');
    }

    const student = await studentsRepository.update(id, tenantId, { photo_url: key }, userId);
    const full = await studentsRepository.findByIdWithRelations(student.id as string, tenantId);
    if (!full) throw new AppError(404, 'Student not found');
    return serializeStudent(full, permissions, true);
  },

  async getAvatarDownloadUrl(id: string, tenantId: number) {
    const student = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!student) throw new AppError(404, 'Student not found');
    if (!student.photo_url) throw new AppError(404, 'No avatar uploaded');

    return getDownloadUrl(student.photo_url);
  },

  /**
   * Batch year-end promotion — see `promote_students()` in
   * supabase/migrations/018_promote_students.sql for the actual atomic
   * logic. This is a thin RPC wrapper; the DB function owns validation of
   * the year/standard lookups and the per-student skip/holdback rules so
   * the whole batch commits or fails together.
   */
  async promote(tenantId: number, input: PromoteStudentsInput) {
    const { data, error } = await supabase.rpc('promote_students', {
      p_tenant_id: tenantId,
      p_target_academic_year_id: input.targetAcademicYearId,
      p_source_standard_id: input.sourceStandardId,
      p_target_standard_id: input.targetStandardId,
      p_student_ids: input.studentIds ?? null,
      p_exclude_student_ids: input.excludeStudentIds,
      p_holdback_student_ids: input.holdbackStudentIds,
      p_dry_run: input.dryRun,
    });

    if (error) throw new AppError(500, error.message);

    const result = data as {
      success?: boolean;
      error?: string;
      dryRun?: boolean;
      promoted?: number;
      repeated?: number;
      skipped?: Array<{ studentId: string; reason: string }>;
      affected?: Array<{ studentId: string; enrollmentType: string; standardId: number }>;
    };

    if (!result?.success) {
      throw new AppError(400, result?.error ?? 'Promotion failed');
    }

    return {
      dryRun: result.dryRun ?? false,
      promoted: result.promoted ?? 0,
      repeated: result.repeated ?? 0,
      skipped: result.skipped ?? [],
      affected: result.affected ?? [],
    };
  },

  async getReports(tenantId: number, userId: string) {
    const assignedStandardIds = await resolveStandardScope(userId);

    const [
      totalStudentsRes,
      activeStudentsRes,
      currentYearRes,
      standardsRes,
      socialCategoriesRes,
      enrollmentsRes,
      socialDetailsRes,
      genderRes,
      statusRes,
      familyDetailsRes,
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .is('deleted_at', null),
      supabase
        .from('lookup_academic_years')
        .select('id, label, start_date')
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('lookup_academic_standards')
        .select('id, value, sort_order')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .neq('value', 'Unassigned')
        .order('sort_order'),
      supabase
        .from('lookup_social_categories')
        .select('id, value')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('value'),
      supabase
        .from('student_enrollments')
        .select('standard_id, students!inner(tenant_id, status)')
        .eq('students.tenant_id', tenantId)
        .eq('students.status', 'Active')
        .eq('is_current', true)
        .is('deleted_at', null),
      supabase
        .from('student_social_details')
        .select('social_category_id, students!inner(tenant_id, status)')
        .eq('students.tenant_id', tenantId)
        .eq('students.status', 'Active')
        .is('students.deleted_at', null),
      supabase
        .from('students')
        .select('gender')
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('status')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null),
      supabase
        .from('student_family_details')
        .select('district, taluk_mandal, village_town, students!inner(tenant_id, status)')
        .eq('students.tenant_id', tenantId)
        .eq('students.status', 'Active')
        .is('students.deleted_at', null),
    ]);

    for (const res of [
      totalStudentsRes,
      activeStudentsRes,
      standardsRes,
      socialCategoriesRes,
      enrollmentsRes,
      socialDetailsRes,
      genderRes,
      statusRes,
      familyDetailsRes,
    ]) {
      if (res.error) throw new AppError(500, res.error.message);
    }

    const allowedStandardIds =
      assignedStandardIds && assignedStandardIds.length > 0
        ? new Set(assignedStandardIds)
        : null;

    const standardCounts = new Map<number, number>();
    for (const row of enrollmentsRes.data ?? []) {
      const standardId = row.standard_id as number;
      if (allowedStandardIds && !allowedStandardIds.has(standardId)) continue;
      standardCounts.set(standardId, (standardCounts.get(standardId) ?? 0) + 1);
    }

    const studentsByStandard = (standardsRes.data ?? [])
      .filter((standard) => !allowedStandardIds || allowedStandardIds.has(standard.id))
      .map((standard) => ({
        standardId: standard.id,
        label: standard.value,
        count: standardCounts.get(standard.id) ?? 0,
      }));

    const socialCategoryCounts = new Map<number, number>();
    let unassignedSocialCategory = 0;
    for (const row of socialDetailsRes.data ?? []) {
      const categoryId = row.social_category_id as number | null;
      if (categoryId == null) {
        unassignedSocialCategory += 1;
        continue;
      }
      socialCategoryCounts.set(categoryId, (socialCategoryCounts.get(categoryId) ?? 0) + 1);
    }

    const studentsBySocialCategory = (socialCategoriesRes.data ?? []).map((category) => ({
      socialCategoryId: category.id,
      label: category.value,
      count: socialCategoryCounts.get(category.id) ?? 0,
    }));

    if (unassignedSocialCategory > 0) {
      studentsBySocialCategory.push({
        socialCategoryId: 0,
        label: 'Unassigned',
        count: unassignedSocialCategory,
      });
    }

    const genderCounts = new Map<string, number>();
    for (const row of genderRes.data ?? []) {
      const gender = row.gender as string;
      genderCounts.set(gender, (genderCounts.get(gender) ?? 0) + 1);
    }

    const studentsByGender = ['Male', 'Female', 'Other'].map((gender) => ({
      gender,
      count: genderCounts.get(gender) ?? 0,
    }));

    const statusCounts = new Map<string, number>();
    for (const row of statusRes.data ?? []) {
      const studentStatus = row.status as string;
      statusCounts.set(studentStatus, (statusCounts.get(studentStatus) ?? 0) + 1);
    }

    const studentsByStatus = ['Active', 'Alumni', 'Discontinued'].map((studentStatus) => ({
      status: studentStatus,
      count: statusCounts.get(studentStatus) ?? 0,
    }));

    let admissionsThisAcademicYear = 0;
    if (currentYearRes.data) {
      const yearStart = currentYearRes.data.start_date as string;
      const { count, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .gte('admission_date', yearStart)
        .is('deleted_at', null);

      if (error) throw new AppError(500, error.message);
      admissionsThisAcademicYear = count ?? 0;
    }

    const scopedActiveStudents = studentsByStandard.reduce((sum, row) => sum + row.count, 0);

    const familyRows = (familyDetailsRes.data ?? []) as Array<
      Record<GeoField, string>
    >;
    const studentsByDistrict = aggregateGeoField(familyRows, 'district');
    const studentsByTaluk = aggregateGeoField(familyRows, 'taluk_mandal');
    const topVillages = aggregateGeoField(familyRows, 'village_town').slice(0, 15);

    return {
      totalStudents: totalStudentsRes.count ?? 0,
      activeStudents: allowedStandardIds ? scopedActiveStudents : (activeStudentsRes.count ?? 0),
      admissionsThisAcademicYear,
      currentAcademicYear: currentYearRes.data?.label ?? null,
      studentsByStandard,
      studentsBySocialCategory,
      studentsByGender,
      studentsByStatus,
      studentsByDistrict,
      studentsByTaluk,
      topVillages,
    };
  },

  /**
   * Fresh-joinee vs. promoted (vs. transferred/repeated) breakdown per
   * standard for a given academic year — the report the `enrollment_type`
   * column (migration 017) and the promotion RPC (018) exist to answer.
   *
   * Deliberately NOT filtered to `students.status = 'Active'`: this is a
   * historical record of who enrolled how in a given year, so a student who
   * later left shouldn't silently disappear from a past year's counts.
   */
  async getEnrollmentStats(tenantId: number, userId: string, query: EnrollmentStatsQuery) {
    const assignedStandardIds = await resolveStandardScope(userId);
    const allowedStandardIds =
      assignedStandardIds && assignedStandardIds.length > 0 ? new Set(assignedStandardIds) : null;

    let academicYear: { id: number; label: string } | null = null;

    if (query.academicYearId) {
      const { data, error } = await supabase
        .from('lookup_academic_years')
        .select('id, label')
        .eq('tenant_id', tenantId)
        .eq('id', query.academicYearId)
        .maybeSingle();
      if (error) throw new AppError(500, error.message);
      if (!data) throw new AppError(400, 'Invalid academic year for this tenant');
      academicYear = data;
    } else {
      const { data, error } = await supabase
        .from('lookup_academic_years')
        .select('id, label')
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .maybeSingle();
      if (error) throw new AppError(500, error.message);
      if (!data) throw new AppError(400, 'No current academic year is configured for this tenant');
      academicYear = data;
    }

    const [standardsRes, enrollmentsRes] = await Promise.all([
      supabase
        .from('lookup_academic_standards')
        .select('id, value, sort_order')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .neq('value', 'Unassigned')
        .order('sort_order'),
      (() => {
        let q = supabase
          .from('student_enrollments')
          .select('standard_id, enrollment_type, students!inner(tenant_id, status)')
          .eq('students.tenant_id', tenantId)
          .eq('academic_year_id', academicYear.id)
          .is('deleted_at', null)
          .is('students.deleted_at', null);
        if (query.standardId) q = q.eq('standard_id', query.standardId);
        // Opt-in only — see enrollmentStatsQuerySchema for why this isn't the default.
        if (query.status) q = q.eq('students.status', query.status);
        return q;
      })(),
    ]);

    if (standardsRes.error) throw new AppError(500, standardsRes.error.message);
    if (enrollmentsRes.error) throw new AppError(500, enrollmentsRes.error.message);

    const countsByStandard = new Map<number, EnrollmentTypeCounts>();
    for (const row of enrollmentsRes.data ?? []) {
      const standardId = row.standard_id as number;
      const enrollmentType = row.enrollment_type as (typeof ENROLLMENT_TYPES)[number];
      if (allowedStandardIds && !allowedStandardIds.has(standardId)) continue;

      const counts = countsByStandard.get(standardId) ?? emptyEnrollmentTypeCounts();
      counts[enrollmentType] = (counts[enrollmentType] ?? 0) + 1;
      countsByStandard.set(standardId, counts);
    }

    const standards = (standardsRes.data ?? [])
      .filter((standard) => !query.standardId || standard.id === query.standardId)
      .filter((standard) => !allowedStandardIds || allowedStandardIds.has(standard.id))
      .map((standard) => {
        const byType = countsByStandard.get(standard.id) ?? emptyEnrollmentTypeCounts();
        const total = ENROLLMENT_TYPES.reduce((sum, type) => sum + byType[type], 0);
        return {
          standardId: standard.id,
          label: standard.value,
          sortOrder: standard.sort_order,
          total,
          byType,
        };
      });

    const totalsByType = emptyEnrollmentTypeCounts();
    for (const standard of standards) {
      for (const type of ENROLLMENT_TYPES) {
        totalsByType[type] += standard.byType[type];
      }
    }
    const total = ENROLLMENT_TYPES.reduce((sum, type) => sum + totalsByType[type], 0);

    return {
      academicYear,
      statusFilter: query.status ?? null,
      standards,
      totals: { total, byType: totalsByType },
    };
  },
};
