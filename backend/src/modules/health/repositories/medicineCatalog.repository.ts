import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { BaseRepository } from '../../../repositories/BaseRepository';

type CatalogRow = {
  id: string;
  tenant_id: number;
  name: string;
  normalized_name: string;
  issue_types: string[];
  default_dose_amount: string | null;
  default_schedule: { morning: boolean; noon: boolean; evening: boolean; night: boolean } | null;
  use_count: number;
  is_custom: boolean;
  default_dose_unit: { id: number; code: string; value: string } | null;
  default_food_timing: { id: number; code: string; value: string } | null;
  default_schedule_preset: { id: number; code: string; value: string } | null;
};

const CATALOG_SELECT = `
  id, tenant_id, name, normalized_name, issue_types, default_dose_amount, default_schedule,
  use_count, is_custom,
  default_dose_unit:lookup_medicine_dose_units ( id, code, value ),
  default_food_timing:lookup_medicine_food_timings ( id, code, value ),
  default_schedule_preset:lookup_medicine_schedule_presets ( id, code, value )
`;

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function serializeCatalogItem(row: CatalogRow) {
  return {
    id: row.id,
    name: row.name,
    issueTypes: row.issue_types ?? [],
    defaultDoseAmount: row.default_dose_amount,
    defaultSchedule: row.default_schedule,
    useCount: row.use_count,
    isCustom: row.is_custom,
    defaultDoseUnit: row.default_dose_unit,
    defaultFoodTiming: row.default_food_timing,
    defaultSchedulePreset: row.default_schedule_preset,
  };
}

class MedicineCatalogRepository extends BaseRepository {
  constructor() {
    super('medicine_catalog');
  }

  async suggest(tenantId: number, query: string, issueTypes: string[], limit: number) {
    let dbQuery = supabase
      .from('medicine_catalog')
      .select(CATALOG_SELECT)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('use_count', { ascending: false })
      .limit(limit);

    if (query.trim()) {
      dbQuery = dbQuery.ilike('name', `%${query.trim()}%`);
    }

    const { data, error } = await dbQuery;
    if (error) throw new AppError(500, error.message);

    let rows = (data ?? []) as unknown as CatalogRow[];
    if (issueTypes.length > 0) {
      rows = rows.filter((row) => {
        const types = row.issue_types ?? [];
        return types.some((t) => issueTypes.includes(t));
      });
    }

    return rows.slice(0, limit).map(serializeCatalogItem);
  }

  async findByNormalizedName(tenantId: number, name: string) {
    const normalized = normalizeName(name);
    const { data, error } = await supabase
      .from('medicine_catalog')
      .select(CATALOG_SELECT)
      .eq('tenant_id', tenantId)
      .eq('normalized_name', normalized)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeCatalogItem(data as unknown as CatalogRow) : null;
  }

  async recordUsage(
    tenantId: number,
    payload: {
      name: string;
      issueTypes: string[];
      doseAmount: string;
      doseUnitId: number;
      foodTimingId: number;
      schedule: { morning: boolean; noon: boolean; evening: boolean; night: boolean };
      schedulePresetId: number;
    },
  ) {
    const normalized = normalizeName(payload.name);
    const existing = await this.findByNormalizedName(tenantId, payload.name);

    if (existing) {
      const mergedIssues = [...new Set([...existing.issueTypes, ...payload.issueTypes])];
      const { error } = await supabase
        .from('medicine_catalog')
        .update({
          issue_types: mergedIssues,
          default_dose_amount: payload.doseAmount,
          default_dose_unit_id: payload.doseUnitId,
          default_food_timing_id: payload.foodTimingId,
          default_schedule: payload.schedule,
          default_schedule_preset_id: payload.schedulePresetId,
          use_count: existing.useCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('tenant_id', tenantId);
      if (error) throw new AppError(500, error.message);
      return;
    }

    const { error } = await supabase.from('medicine_catalog').insert({
      tenant_id: tenantId,
      name: payload.name.trim(),
      normalized_name: normalized,
      issue_types: payload.issueTypes,
      default_dose_amount: payload.doseAmount,
      default_dose_unit_id: payload.doseUnitId,
      default_food_timing_id: payload.foodTimingId,
      default_schedule: payload.schedule,
      default_schedule_preset_id: payload.schedulePresetId,
      use_count: 1,
      is_custom: true,
    });
    if (error) throw new AppError(500, error.message);
  }
}

export const medicineCatalogRepository = new MedicineCatalogRepository();
