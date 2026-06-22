import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

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

function serializeBloodGroup(row: BloodGroupRow) {
  return { id: row.id, value: row.value, isActive: row.is_active };
}

function serializeTenantLookup(row: TenantLookupRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    value: row.value,
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

  async listAdmissionCategories(tenantId: number) {
    const { data, error } = await supabase
      .from('lookup_admission_categories')
      .select('id, tenant_id, value, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(serializeTenantLookup);
  }

  async listDocumentTypes(tenantId: number) {
    const { data, error } = await supabase
      .from('lookup_document_types')
      .select('id, tenant_id, value, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('value');

    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(serializeTenantLookup);
  }

  async createAdmissionCategory(tenantId: number, value: string) {
    const { data, error } = await supabase
      .from('lookup_admission_categories')
      .insert({ tenant_id: tenantId, value })
      .select('id, tenant_id, value, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(409, 'Admission category already exists for this tenant');
      }
      throw new AppError(500, error.message);
    }

    return serializeTenantLookup(data);
  }

  async createDocumentType(tenantId: number, value: string) {
    const { data, error } = await supabase
      .from('lookup_document_types')
      .insert({ tenant_id: tenantId, value })
      .select('id, tenant_id, value, is_active')
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
}

export const lookupRepository = new LookupRepository();
