import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { getDownloadUrl, getUploadUrl } from '../../documents/services/presignedUrl.service';
import type {
  CreateStudentInput,
  DeactivateStudentInput,
  FamilyDetailsInput,
  UpdateStudentInput,
} from '../schemas/student.schemas';
import {
  studentsRepository,
  unwrapFamily,
  type FamilyDetailsRow,
  type StudentRow,
} from '../repositories/students.repository';

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

function serializeStudent(student: StudentRow, permissions: string[], includeFamily = true) {
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
    medicalAlerts: student.medical_alerts,
    status: student.status,
    statusReason: student.status_reason,
    statusChangedAt: student.status_changed_at,
  };

  if (!includeFamily || !permissions.includes('students:view_sensitive_data')) {
    return base;
  }

  const family = unwrapFamily(student);
  return {
    ...base,
    familyDetails: family ? serializeFamily(family) : null,
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

async function validateAdmissionCategoryId(categoryId: number, tenantId: number) {
  const { data, error } = await supabase
    .from('lookup_admission_categories')
    .select('id')
    .eq('id', categoryId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError(400, 'Invalid admission category for this tenant');
}

export const studentService = {
  async list(tenantId: number, page: number, limit: number, search: string | undefined, permissions: string[]) {
    const { data, meta } = await studentsRepository.list(tenantId, page, limit, search);
    return {
      data: data.map((row) => serializeStudent(row, permissions, false)),
      meta,
    };
  },

  async getById(id: string, tenantId: number, permissions: string[]) {
    const student = await studentsRepository.findByIdWithRelations(id, tenantId);
    if (!student) throw new AppError(404, 'Student not found');
    return serializeStudent(student, permissions, true);
  },

  async create(tenantId: number, input: CreateStudentInput, userId: string, permissions: string[]) {
    if (input.bloodGroupId) await validateBloodGroupId(input.bloodGroupId);
    if (input.admissionCategoryId) await validateAdmissionCategoryId(input.admissionCategoryId, tenantId);

    const student = await studentsRepository.create(
      tenantId,
      {
        admission_number: input.admissionNumber,
        first_name: input.firstName,
        last_name: input.lastName ?? null,
        dob: input.dob,
        gender: input.gender,
        blood_group_id: input.bloodGroupId ?? null,
        admission_category_id: input.admissionCategoryId ?? null,
        medical_alerts: input.medicalAlerts ?? null,
      },
      input.familyDetails,
      userId,
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

    if (input.bloodGroupId) await validateBloodGroupId(input.bloodGroupId);
    if (input.admissionCategoryId) await validateAdmissionCategoryId(input.admissionCategoryId, tenantId);

    const changes: Record<string, unknown> = { updated_by: userId };
    if (input.firstName !== undefined) changes.first_name = input.firstName;
    if (input.lastName !== undefined) changes.last_name = input.lastName;
    if (input.dob !== undefined) changes.dob = input.dob;
    if (input.gender !== undefined) changes.gender = input.gender;
    if (input.bloodGroupId !== undefined) changes.blood_group_id = input.bloodGroupId;
    if (input.admissionCategoryId !== undefined) changes.admission_category_id = input.admissionCategoryId;
    if (input.medicalAlerts !== undefined) changes.medical_alerts = input.medicalAlerts;

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

    if (input.familyDetails) {
      if (!permissions.includes('students:view_sensitive_data')) {
        throw new AppError(403, 'Permission denied to update family details');
      }
      await studentsRepository.updateFamilyDetails(id, input.familyDetails as Partial<FamilyDetailsInput>);
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

  async getAvatarDownloadUrls(ids: string[], tenantId: number) {
    const uniqueIds = [...new Set(ids)];
    const { data, error } = await supabase
      .from('students')
      .select('id, photo_url')
      .eq('tenant_id', tenantId)
      .in('id', uniqueIds)
      .is('deleted_at', null)
      .not('photo_url', 'is', null);

    if (error) throw new AppError(500, error.message);

    const urls: Record<string, string> = {};
    await Promise.all(
      (data ?? []).map(async (row) => {
        if (!row.photo_url) return;
        const { downloadUrl } = await getDownloadUrl(row.photo_url);
        urls[row.id] = downloadUrl;
      }),
    );

    return urls;
  },
};
