import type { Request } from 'express';
import type {
  CreateAcademicStandardInput,
  CreateAcademicYearInput,
  CreateLookupValueInput,
  UpdateAcademicYearInput,
  UpdateLookupValueInput,
} from '../schemas/lookup.schemas';
import { lookupRepository } from '../repositories/lookup.repository';
import { parseLocale, type SupportedLocale } from '../../../utils/locale';

function localeFromRequest(req: Request): SupportedLocale {
  const queryLocale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
  const headerLocale = req.headers['accept-language'];
  return parseLocale(queryLocale ?? (typeof headerLocale === 'string' ? headerLocale : undefined));
}

export const lookupService = {
  localeFromRequest,
  listBloodGroups() {
    return lookupRepository.listBloodGroups();
  },

  listAdmissionCategories(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listAdmissionCategories(tenantId, locale);
  },

  listDocumentTypes(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listDocumentTypes(tenantId, locale);
  },

  listReligions(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listReligions(tenantId, locale);
  },

  listSocialCategories(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listSocialCategories(tenantId, locale);
  },

  listAcademicStandards(tenantId: number) {
    return lookupRepository.listAcademicStandards(tenantId);
  },

  listSections(tenantId: number) {
    return lookupRepository.listSections(tenantId);
  },

  listAcademicYears(tenantId: number) {
    return lookupRepository.listAcademicYears(tenantId);
  },

  listLanguages(tenantId: number) {
    return lookupRepository.listLanguages(tenantId);
  },

  createAdmissionCategory(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createAdmissionCategory(tenantId, input.value, input.labelKn);
  },

  createDocumentType(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createDocumentType(tenantId, input.value, input.labelKn);
  },

  createAcademicStandard(tenantId: number, input: CreateAcademicStandardInput) {
    return lookupRepository.createAcademicStandard(tenantId, input.value, input.sortOrder ?? 0);
  },

  createSection(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createSection(tenantId, input.value);
  },

  createAcademicYear(tenantId: number, input: CreateAcademicYearInput) {
    return lookupRepository.createAcademicYear(tenantId, {
      label: input.label,
      startDate: input.startDate,
      endDate: input.endDate,
      isCurrent: input.isCurrent,
    });
  },

  createLanguage(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createLanguage(tenantId, input.value);
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

  updateAcademicStandard(
    id: number,
    tenantId: number,
    input: UpdateLookupValueInput & { sortOrder?: number },
  ) {
    const changes: { value?: string; sort_order?: number; is_active?: boolean } = {};
    if (input.value !== undefined) changes.value = input.value;
    if (input.sortOrder !== undefined) changes.sort_order = input.sortOrder;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return lookupRepository.updateAcademicStandard(id, tenantId, changes);
  },

  updateSection(id: number, tenantId: number, input: UpdateLookupValueInput) {
    const changes: { value?: string; is_active?: boolean } = {};
    if (input.value !== undefined) changes.value = input.value;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return lookupRepository.updateSection(id, tenantId, changes);
  },

  updateAcademicYear(id: number, tenantId: number, input: UpdateAcademicYearInput) {
    const changes: {
      label?: string;
      start_date?: string;
      end_date?: string;
      is_current?: boolean;
      is_active?: boolean;
    } = {};
    if (input.label !== undefined) changes.label = input.label;
    if (input.startDate !== undefined) changes.start_date = input.startDate;
    if (input.endDate !== undefined) changes.end_date = input.endDate;
    if (input.isCurrent !== undefined) changes.is_current = input.isCurrent;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return lookupRepository.updateAcademicYear(id, tenantId, changes);
  },

  updateLanguage(id: number, tenantId: number, input: UpdateLookupValueInput) {
    const changes: { value?: string; is_active?: boolean } = {};
    if (input.value !== undefined) changes.value = input.value;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return lookupRepository.updateLanguage(id, tenantId, changes);
  },
};
