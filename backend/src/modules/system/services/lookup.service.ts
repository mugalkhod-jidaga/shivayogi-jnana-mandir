import type { CreateLookupValueInput, UpdateLookupValueInput } from '../schemas/lookup.schemas';
import { lookupRepository } from '../repositories/lookup.repository';

export const lookupService = {
  listBloodGroups() {
    return lookupRepository.listBloodGroups();
  },

  listAdmissionCategories(tenantId: number) {
    return lookupRepository.listAdmissionCategories(tenantId);
  },

  listDocumentTypes(tenantId: number) {
    return lookupRepository.listDocumentTypes(tenantId);
  },

  createAdmissionCategory(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createAdmissionCategory(tenantId, input.value);
  },

  createDocumentType(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createDocumentType(tenantId, input.value);
  },

  updateAdmissionCategory(id: number, tenantId: number, input: UpdateLookupValueInput) {
    const changes: { value?: string; is_active?: boolean } = {};
    if (input.value !== undefined) changes.value = input.value;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return lookupRepository.updateAdmissionCategory(id, tenantId, changes);
  },

  updateDocumentType(id: number, tenantId: number, input: UpdateLookupValueInput) {
    const changes: { value?: string; is_active?: boolean } = {};
    if (input.value !== undefined) changes.value = input.value;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return lookupRepository.updateDocumentType(id, tenantId, changes);
  },
};
