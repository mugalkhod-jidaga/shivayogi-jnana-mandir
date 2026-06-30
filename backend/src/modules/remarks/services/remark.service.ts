import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { lookupRepository } from '../../system/repositories/lookup.repository';
import {
  assertStudentIdAccess,
  resolveStandardScope,
} from '../../students/services/studentScope.service';
import { usersRepository } from '../../auth/repositories/users.repository';
import type { CreateRemarkInput, RemarkListQuery, UpdateRemarkInput } from '../schemas/remark.schemas';
import { remarkRepository, serializeRemark } from '../repositories/remark.repository';

async function validateRemarkLookups(
  tenantId: number,
  remarkTypeId: number,
  categoryId: number,
) {
  const [types, categories] = await Promise.all([
    lookupRepository.listRemarkTypes(tenantId),
    lookupRepository.listRemarkCategories(tenantId),
  ]);
  const type = types.find((t) => t.id === remarkTypeId);
  const category = categories.find((c) => c.id === categoryId);
  if (!type) throw new AppError(400, 'Invalid remark type');
  if (!category) throw new AppError(400, 'Invalid remark category');
  return type;
}

async function creatorRoleName(userId: string): Promise<string | undefined> {
  const roles = await usersRepository.findRoles(userId);
  return roles[0]?.name;
}

export const remarkService = {
  async list(tenantId: number, query: RemarkListQuery, userId: string) {
    const assignedStandardIds = await resolveStandardScope(userId);
    const { data, meta } = await remarkRepository.list(tenantId, query, assignedStandardIds);
    const serialized = await Promise.all(
      data.map(async (row) => serializeRemark(row, await creatorRoleName(row.created_by))),
    );
    return { data: serialized, meta };
  },

  async stats(tenantId: number, days: number, userId: string) {
    const assignedStandardIds = await resolveStandardScope(userId);
    return remarkRepository.stats(tenantId, days, assignedStandardIds);
  },

  async listForStudent(tenantId: number, studentId: string, query: RemarkListQuery, userId: string) {
    await assertStudentIdAccess(studentId, tenantId, userId);
    return this.list(tenantId, { ...query, studentId }, userId);
  },

  async create(
    tenantId: number,
    studentId: string,
    input: CreateRemarkInput,
    userId: string,
  ) {
    await assertStudentIdAccess(studentId, tenantId, userId);
    const remarkType = await validateRemarkLookups(tenantId, input.remarkTypeId, input.categoryId);

    if (remarkType.value === 'Negative') {
      if (!input.severity) throw new AppError(400, 'Severity is required for negative remarks');
    } else if (input.severity) {
      throw new AppError(400, 'Severity applies only to negative remarks');
    }

    const row = await remarkRepository.create(tenantId, studentId, userId, {
      remark_type_id: input.remarkTypeId,
      category_id: input.categoryId,
      title: input.title,
      description: input.description,
      severity: remarkType.value === 'Negative' ? input.severity ?? null : null,
      tags: input.tags,
      is_flagged: input.isFlagged ?? false,
    });

    return serializeRemark(row, await creatorRoleName(userId));
  },

  async update(
    id: string,
    tenantId: number,
    input: UpdateRemarkInput,
    userId: string,
    permissions: string[],
  ) {
    const existing = await remarkRepository.findById(id, tenantId);
    if (!existing) throw new AppError(404, 'Remark not found');

    await assertStudentIdAccess(existing.student_id, tenantId, userId);

    const isOwner = existing.created_by === userId;
    const canManage = permissions.includes('remarks:manage');
    if (!canManage && !isOwner) throw new AppError(403, 'Permission denied');
    if (!canManage && isOwner) {
      const created = new Date(existing.created_at).getTime();
      if (Date.now() - created > 24 * 60 * 60 * 1000) {
        throw new AppError(403, 'Edit window expired');
      }
    }

    const changes: Record<string, unknown> = {};
    if (input.title !== undefined) changes.title = input.title;
    if (input.description !== undefined) changes.description = input.description;
    if (input.tags !== undefined) changes.tags = input.tags;
    if (input.isFlagged !== undefined) changes.is_flagged = input.isFlagged;
    if (input.followUpNote !== undefined) changes.follow_up_note = input.followUpNote;
    if (input.severity !== undefined) changes.severity = input.severity;
    if (input.resolved === true) changes.resolved_at = new Date().toISOString();
    if (input.resolved === false) changes.resolved_at = null;

    await remarkRepository.update(id, tenantId, changes, userId);
    const row = await remarkRepository.findById(id, tenantId);
    if (!row) throw new AppError(500, 'Failed to load updated remark');
    return serializeRemark(row, await creatorRoleName(row.created_by));
  },

  async softDelete(id: string, tenantId: number, userId: string, permissions: string[]) {
    if (!permissions.includes('remarks:manage')) {
      throw new AppError(403, 'Permission denied');
    }
    const existing = await remarkRepository.findById(id, tenantId);
    if (!existing) throw new AppError(404, 'Remark not found');
    await remarkRepository.softDelete(id, tenantId, userId);
  },
};
