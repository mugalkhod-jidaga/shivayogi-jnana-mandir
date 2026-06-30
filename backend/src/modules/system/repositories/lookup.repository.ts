import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { parseLocale, resolveLocalizedLabel, type SupportedLocale } from '../../../utils/locale';

export interface BloodGroupRow {
  id: number;
  value: string;
  is_active: boolean;
}

export interface TenantLookupRow {
  id: number;
  tenant_id: number;
  value: string;
  is_active: boolean;
}

export interface AcademicStandardRow extends TenantLookupRow {
  sort_order: number;
}

export interface AcademicYearRow {
  id: number;
  tenant_id: number;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
}

function serializeBloodGroup(row: BloodGroupRow) {
  return { id: row.id, value: row.value, isActive: row.is_active };
}

function serializeTenantLookup(row: TenantLookupRow, locale: SupportedLocale = 'en') {
  const labels = (row as TenantLookupRow & { labels?: Record<string, string> }).labels;
  const value = resolveLocalizedLabel(labels, row.value, locale);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    value,
    labels: labels ?? { en: row.value },
    isActive: row.is_active,
  };
}

function serializeAcademicStandard(row: AcademicStandardRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    value: row.value,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function serializeAcademicYear(row: AcademicYearRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    label: row.label,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    isActive: row.is_active,
  };
}

class LookupRepository {
  async listBloodGroups() {
    const { data, error } = await supabase
      .from('lookup_blood_groups')
      .select('id, value, is_active')
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(serializeBloodGroup);
  }

  async listAdmissionCategories(tenantId: number, locale: SupportedLocale = 'en') {
    const { data, error } = await supabase
      .from('lookup_admission_categories')
      .select('id, tenant_id, value, labels, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeTenantLookup(row as TenantLookupRow, locale));
  }

  async listDocumentTypes(tenantId: number, locale: SupportedLocale = 'en') {
    const { data, error } = await supabase
      .from('lookup_document_types')
      .select('id, tenant_id, value, labels, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeTenantLookup(row as TenantLookupRow, locale));
  }

  async listReligions(tenantId: number, locale: SupportedLocale = 'en') {
    const { data, error } = await supabase
      .from('lookup_religions')
      .select('id, tenant_id, value, labels, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeTenantLookup(row as TenantLookupRow, locale));
  }

  async listSocialCategories(tenantId: number, locale: SupportedLocale = 'en') {
    const { data, error } = await supabase
      .from('lookup_social_categories')
      .select('id, tenant_id, value, labels, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeTenantLookup(row as TenantLookupRow, locale));
  }

  async createAdmissionCategory(tenantId: number, value: string, labelKn?: string) {
    const labels = labelKn ? { en: value, kn: labelKn } : { en: value };
    const { data, error } = await supabase
      .from('lookup_admission_categories')
      .insert({ tenant_id: tenantId, value, labels })
      .select('id, tenant_id, value, labels, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Admission category already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async createDocumentType(tenantId: number, value: string, labelKn?: string) {
    const labels = labelKn ? { en: value, kn: labelKn } : { en: value };
    const { data, error } = await supabase
      .from('lookup_document_types')
      .insert({ tenant_id: tenantId, value, labels })
      .select('id, tenant_id, value, labels, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Document type already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async updateAdmissionCategory(
    id: number,
    tenantId: number,
    changes: { value?: string; is_active?: boolean },
  ) {
    const { data, error } = await supabase
      .from('lookup_admission_categories')
      .update(changes)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new AppError(404, 'Admission category not found');
      if (error.code === '23505') {
        throw new AppError(409, 'Admission category already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async updateDocumentType(
    id: number,
    tenantId: number,
    changes: { value?: string; is_active?: boolean },
  ) {
    const { data, error } = await supabase
      .from('lookup_document_types')
      .update(changes)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new AppError(404, 'Document type not found');
      if (error.code === '23505') {
        throw new AppError(409, 'Document type already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async listAcademicStandards(tenantId: number) {
    const { data, error } = await supabase
      .from('lookup_academic_standards')
      .select('id, tenant_id, value, sort_order, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order')
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeAcademicStandard(row as AcademicStandardRow));
  }

  async listSections(tenantId: number) {
    const { data, error } = await supabase
      .from('lookup_sections')
      .select('id, tenant_id, value, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeTenantLookup(row as TenantLookupRow));
  }

  async listAcademicYears(tenantId: number) {
    const { data, error } = await supabase
      .from('lookup_academic_years')
      .select('id, tenant_id, label, start_date, end_date, is_current, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeAcademicYear(row as AcademicYearRow));
  }

  async listLanguages(tenantId: number) {
    const { data, error } = await supabase
      .from('lookup_languages')
      .select('id, tenant_id, value, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeTenantLookup(row as TenantLookupRow));
  }

  async createAcademicStandard(tenantId: number, value: string, sortOrder = 0) {
    const { data, error } = await supabase
      .from('lookup_academic_standards')
      .insert({ tenant_id: tenantId, value, sort_order: sortOrder })
      .select('id, tenant_id, value, sort_order, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Academic standard already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeAcademicStandard(data as AcademicStandardRow);
  }

  async createSection(tenantId: number, value: string) {
    const { data, error } = await supabase
      .from('lookup_sections')
      .insert({ tenant_id: tenantId, value, is_active: true })
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Section already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async createAcademicYear(
    tenantId: number,
    input: { label: string; startDate: string; endDate: string; isCurrent?: boolean },
  ) {
    if (input.isCurrent) {
      await supabase
        .from('lookup_academic_years')
        .update({ is_current: false })
        .eq('tenant_id', tenantId);
    }

    const { data, error } = await supabase
      .from('lookup_academic_years')
      .insert({
        tenant_id: tenantId,
        label: input.label,
        start_date: input.startDate,
        end_date: input.endDate,
        is_current: input.isCurrent ?? false,
      })
      .select('id, tenant_id, label, start_date, end_date, is_current, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Academic year already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeAcademicYear(data as AcademicYearRow);
  }

  async createLanguage(tenantId: number, value: string) {
    const { data, error } = await supabase
      .from('lookup_languages')
      .insert({ tenant_id: tenantId, value })
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Language already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async updateAcademicStandard(
    id: number,
    tenantId: number,
    changes: { value?: string; sort_order?: number; is_active?: boolean },
  ) {
    const { data, error } = await supabase
      .from('lookup_academic_standards')
      .update(changes)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, value, sort_order, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new AppError(404, 'Academic standard not found');
      if (error.code === '23505') {
        throw new AppError(409, 'Academic standard already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeAcademicStandard(data as AcademicStandardRow);
  }

  async updateSection(
    id: number,
    tenantId: number,
    changes: { value?: string; is_active?: boolean },
  ) {
    const { data, error } = await supabase
      .from('lookup_sections')
      .update(changes)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new AppError(404, 'Section not found');
      if (error.code === '23505') throw new AppError(409, 'Section already exists for this tenant');
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async updateAcademicYear(
    id: number,
    tenantId: number,
    changes: {
      label?: string;
      start_date?: string;
      end_date?: string;
      is_current?: boolean;
      is_active?: boolean;
    },
  ) {
    if (changes.is_current) {
      await supabase
        .from('lookup_academic_years')
        .update({ is_current: false })
        .eq('tenant_id', tenantId);
    }

    const { data, error } = await supabase
      .from('lookup_academic_years')
      .update(changes)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, label, start_date, end_date, is_current, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new AppError(404, 'Academic year not found');
      if (error.code === '23505') throw new AppError(409, 'Academic year already exists for this tenant');
      throw new AppError(500, error.message);
    }

    return serializeAcademicYear(data as AcademicYearRow);
  }

  async updateLanguage(
    id: number,
    tenantId: number,
    changes: { value?: string; is_active?: boolean },
  ) {
    const { data, error } = await supabase
      .from('lookup_languages')
      .update(changes)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new AppError(404, 'Language not found');
      if (error.code === '23505') throw new AppError(409, 'Language already exists for this tenant');
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }
}

export const lookupRepository = new LookupRepository();
