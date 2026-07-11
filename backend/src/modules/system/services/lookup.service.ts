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

  listAdmissionCategories(tenantId: number, locale: SupportedLocale = 'en', includeInactive = false) {
    return lookupRepository.listAdmissionCategories(tenantId, locale, includeInactive);
  },

  listDocumentTypes(tenantId: number, locale: SupportedLocale = 'en', includeInactive = false) {
    return lookupRepository.listDocumentTypes(tenantId, locale, includeInactive);
  },

  listReligions(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listReligions(tenantId, locale);
  },

  listSocialCategories(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listSocialCategories(tenantId, locale);
  },

  listAcademicStandards(tenantId: number, locale: SupportedLocale = 'en', includeInactive = false) {
    return lookupRepository.listAcademicStandards(tenantId, locale, includeInactive);
  },

  listSections(tenantId: number, locale: SupportedLocale = 'en', includeInactive = false) {
    return lookupRepository.listSections(tenantId, locale, includeInactive);
  },

  listAcademicYears(tenantId: number) {
    return lookupRepository.listAcademicYears(tenantId);
  },

  listLanguages(tenantId: number, locale: SupportedLocale = 'en', includeInactive = false) {
    return lookupRepository.listLanguages(tenantId, locale, includeInactive);
  },

  listRemarkTypes(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listRemarkTypes(tenantId, locale);
  },

  listRemarkCategories(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listRemarkCategories(tenantId, locale);
  },

  listHostelAttendanceStatuses(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listHostelAttendanceStatuses(tenantId, locale);
  },

  listMedicalRecordTypes(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listMedicalRecordTypes(tenantId, locale);
  },

  listHealthSeverities(locale: SupportedLocale = 'en') {
    return lookupRepository.listHealthSeverities(locale);
  },

  listHealthAttachmentKinds(locale: SupportedLocale = 'en') {
    return lookupRepository.listHealthAttachmentKinds(locale);
  },

  listHealthIssueTypes(tenantId: number, locale: SupportedLocale = 'en') {
    return lookupRepository.listHealthIssueTypes(tenantId, locale);
  },

  listMedicineFoodTimings(locale: SupportedLocale = 'en') {
    return lookupRepository.listMedicineFoodTimings(locale);
  },

  listMedicineDoseUnits(locale: SupportedLocale = 'en') {
    return lookupRepository.listMedicineDoseUnits(locale);
  },

  listMedicineSchedulePresets(locale: SupportedLocale = 'en') {
    return lookupRepository.listMedicineSchedulePresets(locale);
  },

  createAdmissionCategory(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createAdmissionCategory(tenantId, input.value, input.labelKn);
  },

  createDocumentType(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createDocumentType(tenantId, input.value, input.labelKn);
  },

  createAcademicStandard(tenantId: number, input: CreateAcademicStandardInput) {
    return lookupRepository.createAcademicStandard(
      tenantId,
      input.value,
      input.sortOrder ?? 0,
      input.labelKn,
    );
  },

  createSection(tenantId: number, input: CreateLookupValueInput) {
    return lookupRepository.createSection(tenantId, input.value, input.labelKn);
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
    return lookupRepository.createLanguage(tenantId, input.value, input.labelKn);
  },

  updateAdmissionCategory(id: number, tenantId: number, input: UpdateLookupValueInput) {
    return lookupRepository.updateAdmissionCategory(id, tenantId, {
      value: input.value,
      is_active: input.isActive,
      labelKn: input.labelKn,
    });
  },

  updateDocumentType(id: number, tenantId: number, input: UpdateLookupValueInput) {
    return lookupRepository.updateDocumentType(id, tenantId, {
      value: input.value,
      is_active: input.isActive,
      labelKn: input.labelKn,
    });
  },

  updateAcademicStandard(
    id: number,
    tenantId: number,
    input: UpdateLookupValueInput & { sortOrder?: number },
  ) {
    return lookupRepository.updateAcademicStandard(id, tenantId, {
      value: input.value,
      sort_order: input.sortOrder,
      is_active: input.isActive,
      labelKn: input.labelKn,
    });
  },

  updateSection(id: number, tenantId: number, input: UpdateLookupValueInput) {
    return lookupRepository.updateSection(id, tenantId, {
      value: input.value,
      is_active: input.isActive,
      labelKn: input.labelKn,
    });
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
    return lookupRepository.updateLanguage(id, tenantId, {
      value: input.value,
      is_active: input.isActive,
      labelKn: input.labelKn,
    });
  },
};
