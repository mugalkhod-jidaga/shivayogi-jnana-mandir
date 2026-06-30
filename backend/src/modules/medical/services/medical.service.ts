import { AppError } from '../../../utils/AppError';
import { lookupRepository } from '../../system/repositories/lookup.repository';
import {
  assertStudentIdAccess,
  resolveStandardScope,
} from '../../students/services/studentScope.service';
import type {
  CreateMedicalRecordInput,
  MedicalListQuery,
  UpdateMedicalRecordInput,
} from '../schemas/medical.schemas';
import { medicalRepository } from '../repositories/medical.repository';

async function validateRecordType(tenantId: number, recordTypeId: number) {
  const types = await lookupRepository.listMedicalRecordTypes(tenantId);
  if (!types.some((t) => t.id === recordTypeId)) {
    throw new AppError(400, 'Invalid medical record type');
  }
}

export const medicalService = {
  async list(tenantId: number, query: MedicalListQuery, userId: string) {
    const assignedStandardIds = await resolveStandardScope(userId);
    return medicalRepository.list(tenantId, query, assignedStandardIds);
  },

  async listForStudent(tenantId: number, studentId: string, query: MedicalListQuery, userId: string) {
    await assertStudentIdAccess(studentId, tenantId, userId);
    return this.list(tenantId, { ...query, studentId }, userId);
  },

  async create(
    tenantId: number,
    studentId: string,
    input: CreateMedicalRecordInput,
    userId: string,
  ) {
    await assertStudentIdAccess(studentId, tenantId, userId);
    await validateRecordType(tenantId, input.recordTypeId);
    return medicalRepository.create(tenantId, studentId, userId, {
      record_type_id: input.recordTypeId,
      title: input.title,
      description: input.description,
      recorded_on: input.recordedOn,
      is_ongoing: input.isOngoing ?? false,
    });
  },

  async update(
    id: string,
    tenantId: number,
    input: UpdateMedicalRecordInput,
    userId: string,
    permissions: string[],
  ) {
    const existing = await medicalRepository.findById(id, tenantId);
    if (!existing) throw new AppError(404, 'Medical record not found');
    await assertStudentIdAccess(existing.studentId, tenantId, userId);

    if (!permissions.includes('medical:edit')) {
      throw new AppError(403, 'Permission denied');
    }

    if (input.recordTypeId !== undefined) {
      await validateRecordType(tenantId, input.recordTypeId);
    }

    const changes: Record<string, unknown> = {};
    if (input.recordTypeId !== undefined) changes.record_type_id = input.recordTypeId;
    if (input.title !== undefined) changes.title = input.title;
    if (input.description !== undefined) changes.description = input.description;
    if (input.recordedOn !== undefined) changes.recorded_on = input.recordedOn;
    if (input.isOngoing !== undefined) changes.is_ongoing = input.isOngoing;

    await medicalRepository.update(id, tenantId, changes, userId);
    const row = await medicalRepository.findById(id, tenantId);
    if (!row) throw new AppError(500, 'Failed to load updated record');
    return row;
  },

  async softDelete(id: string, tenantId: number, userId: string, permissions: string[]) {
    if (!permissions.includes('medical:edit')) {
      throw new AppError(403, 'Permission denied');
    }
    const existing = await medicalRepository.findById(id, tenantId);
    if (!existing) throw new AppError(404, 'Medical record not found');
    await medicalRepository.softDelete(id, tenantId, userId);
  },
};
