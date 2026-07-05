import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { studentsRepository } from '../../students/repositories/students.repository';
import type { CreateHealthVisitInput, HealthVisitListQuery, RecentVisitsQuery } from '../schemas/health.schemas';

type SeverityRow = { id: number; code: string; value: string };
type DoseUnitRow = { id: number; code: string; value: string; dose_group: string };
type FoodTimingRow = { id: number; code: string; value: string };
type SchedulePresetRow = { id: number; code: string; value: string };

type MedicineRow = {
  id: string;
  medicine_name: string;
  dose_amount: string;
  treatment_doses: string | null;
  schedule: { morning: boolean; noon: boolean; evening: boolean; night: boolean };
  medicine_notes: string | null;
  dose_unit: DoseUnitRow;
  food_timing: FoodTimingRow;
  schedule_preset: SchedulePresetRow;
};

type VisitRow = {
  id: string;
  tenant_id: number;
  student_id: string;
  visit_date: string;
  issue_type: string;
  symptoms: string;
  treated_by: string | null;
  notes: string | null;
  temperature: string | null;
  blood_pressure: string | null;
  oxygen_level: string | null;
  created_at: string;
  updated_at: string;
  severity: SeverityRow;
  students: {
    id: string;
    first_name: string;
    last_name: string | null;
    admission_number: string;
    health_status: string | null;
    blood_group: { id: number; value: string } | null;
  };
  creator: { id: string; first_name: string; last_name: string | null };
  health_visit_medicines?: MedicineRow[];
};

const VISIT_SELECT = `
  id, tenant_id, student_id, visit_date, issue_type, symptoms, treated_by, notes,
  temperature, blood_pressure, oxygen_level, created_at, updated_at,
  severity:lookup_health_severities!inner ( id, code, value ),
  students!inner (
    id, first_name, last_name, admission_number, health_status,
    blood_group:lookup_blood_groups ( id, value )
  ),
  creator:user_profiles!health_visits_created_by_fkey ( id, first_name, last_name )
`;

const MEDICINE_SELECT = `
  id, health_visit_id, medicine_name, dose_amount, treatment_doses, schedule, medicine_notes,
  dose_unit:lookup_medicine_dose_units!inner ( id, code, value, dose_group ),
  food_timing:lookup_medicine_food_timings!inner ( id, code, value ),
  schedule_preset:lookup_medicine_schedule_presets!inner ( id, code, value )
`;

function serializeMedicine(row: MedicineRow) {
  return {
    id: row.id,
    medicineName: row.medicine_name,
    doseAmount: row.dose_amount,
    treatmentDoses: row.treatment_doses,
    schedule: row.schedule,
    medicineNotes: row.medicine_notes,
    doseUnit: {
      id: row.dose_unit.id,
      code: row.dose_unit.code,
      value: row.dose_unit.value,
      doseGroup: row.dose_unit.dose_group,
    },
    foodTiming: {
      id: row.food_timing.id,
      code: row.food_timing.code,
      value: row.food_timing.value,
    },
    schedulePreset: {
      id: row.schedule_preset.id,
      code: row.schedule_preset.code,
      value: row.schedule_preset.value,
    },
  };
}

export function serializeHealthVisit(row: VisitRow, medicines: MedicineRow[] = []) {
  const meds = medicines.length ? medicines : row.health_visit_medicines ?? [];
  return {
    id: row.id,
    studentId: row.student_id,
    visitDate: row.visit_date,
    issueType: row.issue_type,
    symptoms: row.symptoms,
    treatedBy: row.treated_by,
    notes: row.notes,
    temperature: row.temperature,
    bloodPressure: row.blood_pressure,
    oxygenLevel: row.oxygen_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    severity: {
      id: row.severity.id,
      code: row.severity.code,
      value: row.severity.value,
    },
    student: {
      id: row.students.id,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
      admissionNumber: row.students.admission_number,
      healthStatus: row.students.health_status,
      bloodGroup: row.students.blood_group,
    },
    createdBy: {
      id: row.creator.id,
      firstName: row.creator.first_name,
      lastName: row.creator.last_name,
    },
    medicines: meds.map(serializeMedicine),
  };
}

class HealthRepository extends BaseRepository {
  constructor() {
    super('health_visits');
  }

  private async scopedStudentIds(
    tenantId: number,
    assignedStandardIds?: number[],
  ): Promise<string[] | undefined> {
    if (assignedStandardIds === undefined) return undefined;
    return studentsRepository.listStudentIdsByStandards(tenantId, assignedStandardIds);
  }

  private async loadMedicines(visitIds: string[], tenantId: number) {
    if (!visitIds.length) return new Map<string, MedicineRow[]>();
    const { data, error } = await supabase
      .from('health_visit_medicines')
      .select(MEDICINE_SELECT)
      .eq('tenant_id', tenantId)
      .in('health_visit_id', visitIds)
      .is('deleted_at', null);
    if (error) throw new AppError(500, error.message);

    const map = new Map<string, MedicineRow[]>();
    for (const row of (data ?? []) as unknown as (MedicineRow & { health_visit_id: string })[]) {
      const visitId = (row as { health_visit_id: string }).health_visit_id;
      const list = map.get(visitId) ?? [];
      list.push(row);
      map.set(visitId, list);
    }
    return map;
  }

  async list(tenantId: number, query: HealthVisitListQuery, assignedStandardIds?: number[]) {
    const { page, limit, search, studentId, severityId } = query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    const scopedIds = await this.scopedStudentIds(tenantId, assignedStandardIds);
    if (scopedIds && scopedIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit: cappedLimit } };
    }

    let dbQuery = supabase
      .from('health_visits')
      .select(VISIT_SELECT, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (studentId) dbQuery = dbQuery.eq('student_id', studentId);
    if (scopedIds) dbQuery = dbQuery.in('student_id', scopedIds);
    if (severityId) dbQuery = dbQuery.eq('severity_id', severityId);
    if (search) {
      dbQuery = dbQuery.or(`issue_type.ilike.%${search}%,symptoms.ilike.%${search}%`);
    }

    const { data, count, error } = await dbQuery.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);

    const rows = (data ?? []) as unknown as VisitRow[];
    const medicineMap = await this.loadMedicines(
      rows.map((r) => r.id),
      tenantId,
    );

    return {
      data: rows.map((row) => serializeHealthVisit(row, medicineMap.get(row.id) ?? [])),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async listRecent(tenantId: number, query: RecentVisitsQuery, assignedStandardIds?: number[]) {
    const { limit, search } = query;
    const scopedIds = await this.scopedStudentIds(tenantId, assignedStandardIds);
    if (scopedIds && scopedIds.length === 0) return [];

    let dbQuery = supabase
      .from('health_visits')
      .select(VISIT_SELECT)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (scopedIds) dbQuery = dbQuery.in('student_id', scopedIds);
    if (search) {
      dbQuery = dbQuery.or(`issue_type.ilike.%${search}%,symptoms.ilike.%${search}%`);
    }

    const { data, error } = await dbQuery;
    if (error) throw new AppError(500, error.message);

    const rows = (data ?? []) as unknown as VisitRow[];
    const medicineMap = await this.loadMedicines(
      rows.map((r) => r.id),
      tenantId,
    );
    return rows.map((row) => serializeHealthVisit(row, medicineMap.get(row.id) ?? []));
  }

  async findById(id: string, tenantId: number) {
    const { data, error } = await supabase
      .from('health_visits')
      .select(VISIT_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    if (!data) return null;

    const medicineMap = await this.loadMedicines([id], tenantId);
    return serializeHealthVisit(data as unknown as VisitRow, medicineMap.get(id) ?? []);
  }

  async getStudentSummary(studentId: string, tenantId: number) {
    const { data, error } = await supabase
      .from('health_visits')
      .select('id, visit_date, issue_type')
      .eq('tenant_id', tenantId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new AppError(500, error.message);

    const visits = data ?? [];
    const last = visits[0];
    return {
      visitCount: visits.length,
      lastVisitDate: last?.visit_date ?? null,
      lastIssueType: last?.issue_type ?? null,
    };
  }

  async createVisit(
    tenantId: number,
    userId: string,
    input: CreateHealthVisitInput,
    medicineRows: Array<{
      medicine_name: string;
      dose_amount: string;
      dose_unit_id: number;
      treatment_doses: string;
      food_timing_id: number;
      schedule: CreateHealthVisitInput['medicines'][0]['schedule'];
      schedule_preset_id: number;
      medicine_notes?: string;
      start_date: string;
    }>,
  ) {
    const { data: visit, error: visitError } = await supabase
      .from('health_visits')
      .insert({
        tenant_id: tenantId,
        student_id: input.studentId,
        visit_date: input.visitDate,
        issue_type: input.issueType,
        symptoms: input.symptoms,
        severity_id: input.severityId,
        treated_by: input.treatedBy ?? null,
        notes: input.notes ?? null,
        temperature: input.temperature ?? null,
        blood_pressure: input.bloodPressure ?? null,
        oxygen_level: input.oxygenLevel ?? null,
        created_by: userId,
      })
      .select('id')
      .single();

    if (visitError) throw new AppError(500, visitError.message);

    const medicineInserts = medicineRows.map((row) => ({
      tenant_id: tenantId,
      health_visit_id: visit.id,
      student_id: input.studentId,
      ...row,
    }));

    const { error: medError } = await supabase.from('health_visit_medicines').insert(medicineInserts);
    if (medError) {
      await supabase
        .from('health_visits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', visit.id)
        .eq('tenant_id', tenantId);
      throw new AppError(500, medError.message);
    }

    const full = await this.findById(visit.id, tenantId);
    if (!full) throw new AppError(500, 'Failed to load created visit');
    return full;
  }

  async updateStudentHealthStatus(studentId: string, tenantId: number, status: string, userId: string) {
    await studentsRepository.update(studentId, tenantId, { health_status: status }, userId);
  }
}

export const healthRepository = new HealthRepository();
