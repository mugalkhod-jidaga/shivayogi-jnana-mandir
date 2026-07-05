import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { usersRepository } from '../../auth/repositories/users.repository';
import { getDownloadUrl, getUploadUrl } from '../../documents/services/presignedUrl.service';
import type {
  AcademicPlacementInput,
  CreateStudentInput,
  DeactivateStudentInput,
  EmergencyContactInput,
  StudentListQuery,
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

function maskAadhaar(aadhaar: string | null, canViewFull: boolean): string | null {
  if (!aadhaar) return null;
  if (canViewFull) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
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

function serializeStudent(student: StudentRow, permissions: string[], includeFamily = true) {
  const canViewSensitive = permissions.includes('students:view_sensitive_data');
  const enrollment = unwrapEnrollment(student);
  const social = unwrapSocial(student);

  const base = {
    id: student.id,
    admissionNumber: student.admission_number,
    firstName: student.first_name,
    lastName: student.last_name,
    dob: student.dob,
    gender: student.gender,
    photoUrl: student.photo_url,
    bloodGroup: student.blood_group ?? null,
    admissionCategory: student.admission_category ?? null,
    socialCategory: social?.social_category ?? null,
    motherTongue: student.mother_tongue ?? null,
    admissionDate: student.admission_date,
    aadhaarNumber: maskAadhaar(student.aadhaar_number, canViewSensitive),
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

  if (!includeFamily || !canViewSensitive) {
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

async function validateAcademicPlacement(tenantId: number, placement: AcademicPlacementInput) {
  await validateTenantLookup('lookup_academic_years', placement.academicYearId, tenantId, 'academic year');
  await validateTenantLookup('lookup_academic_standards', placement.standardId, tenantId, 'standard');
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
      await validateAcademicPlacement(tenantId, input.academicPlacement as AcademicPlacementInput);
    }

    const changes: Record<string, unknown> = { updated_by: userId };
    if (input.firstName !== undefined) changes.first_name = input.firstName;
    if (input.lastName !== undefined) changes.last_name = input.lastName;
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
      if (!permissions.includes('students:view_sensitive_data')) {
        throw new AppError(403, 'Permission denied to update family details');
      }
      await studentsRepository.updateFamilyDetails(id, input.familyDetails);
    }

    if (input.socialDetails) {
      if (!permissions.includes('students:view_sensitive_data')) {
        throw new AppError(403, 'Permission denied to update social details');
      }
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

    return {
      totalStudents: totalStudentsRes.count ?? 0,
      activeStudents: allowedStandardIds ? scopedActiveStudents : (activeStudentsRes.count ?? 0),
      admissionsThisAcademicYear,
      currentAcademicYear: currentYearRes.data?.label ?? null,
      studentsByStandard,
      studentsBySocialCategory,
      studentsByGender,
      studentsByStatus,
    };
  },
};
