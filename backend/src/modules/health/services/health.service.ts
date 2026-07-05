import { AppError } from '../../../utils/AppError';
import { lookupRepository } from '../../system/repositories/lookup.repository';
import {
  assertStudentIdAccess,
  resolveStandardScope,
} from '../../students/services/studentScope.service';
import type {
  CreateHealthVisitInput,
  HealthVisitListQuery,
  RecentVisitsQuery,
} from '../schemas/health.schemas';
import { healthRepository } from '../repositories/health.repository';

function formatDoseDisplay(amount: string, unitValue: string, unitCode: string): string {
  if (unitCode === 'as_directed') return 'As directed';
  if (unitCode === 'apply') return 'Apply thin layer';
  return `${amount} ${unitValue}`.trim();
}

function hasScheduleSlot(schedule: CreateHealthVisitInput['medicines'][0]['schedule']) {
  return schedule.morning || schedule.noon || schedule.evening || schedule.night;
}

async function validateLookups(tenantId: number, input: CreateHealthVisitInput) {
  const [severities, doseUnits, foodTimings, schedulePresets] = await Promise.all([
    lookupRepository.listHealthSeverities(),
    lookupRepository.listMedicineDoseUnits(),
    lookupRepository.listMedicineFoodTimings(),
    lookupRepository.listMedicineSchedulePresets(),
  ]);

  const severity = severities.find((s) => s.id === input.severityId);
  if (!severity) throw new AppError(400, 'Invalid severity');

  for (let i = 0; i < input.medicines.length; i++) {
    const med = input.medicines[i];
    const doseUnit = doseUnits.find((u) => u.id === med.doseUnitId);
    const foodTiming = foodTimings.find((f) => f.id === med.foodTimingId);
    const preset = schedulePresets.find((p) => p.id === med.schedulePresetId);

    if (!doseUnit) throw new AppError(400, `Invalid dose unit for medicine ${i + 1}`);
    if (!foodTiming) throw new AppError(400, `Invalid food timing for medicine ${i + 1}`);
    if (!preset) throw new AppError(400, `Invalid schedule preset for medicine ${i + 1}`);

    if (preset.code !== 'as_needed' && !hasScheduleSlot(med.schedule)) {
      throw new AppError(400, `Medicine ${i + 1}: select at least one schedule slot`);
    }
  }

  return severity;
}

function mapHealthStatus(severityCode: string): string {
  if (severityCode === 'normal') return 'recovering';
  return 'sick';
}

export const healthService = {
  async list(tenantId: number, query: HealthVisitListQuery, userId: string) {
    const assignedStandardIds = await resolveStandardScope(userId);
    return healthRepository.list(tenantId, query, assignedStandardIds);
  },

  async listRecent(tenantId: number, query: RecentVisitsQuery, userId: string) {
    const assignedStandardIds = await resolveStandardScope(userId);
    return healthRepository.listRecent(tenantId, query, assignedStandardIds);
  },

  async listForStudent(
    tenantId: number,
    studentId: string,
    query: HealthVisitListQuery,
    userId: string,
  ) {
    await assertStudentIdAccess(studentId, tenantId, userId);
    return this.list(tenantId, { ...query, studentId }, userId);
  },

  async getStudentSummary(studentId: string, tenantId: number, userId: string) {
    await assertStudentIdAccess(studentId, tenantId, userId);
    return healthRepository.getStudentSummary(studentId, tenantId);
  },

  async getById(id: string, tenantId: number, userId: string) {
    const visit = await healthRepository.findById(id, tenantId);
    if (!visit) throw new AppError(404, 'Health visit not found');
    await assertStudentIdAccess(visit.studentId, tenantId, userId);
    return visit;
  },

  async saveVisit(tenantId: number, input: CreateHealthVisitInput, userId: string) {
    await assertStudentIdAccess(input.studentId, tenantId, userId);

    const severity = await validateLookups(tenantId, input);

    const [doseUnits] = await Promise.all([lookupRepository.listMedicineDoseUnits()]);

    const medicineRows = input.medicines.map((med) => {
      const doseUnit = doseUnits.find((u) => u.id === med.doseUnitId)!;
      return {
        medicine_name: med.medicineName,
        dose_amount: med.doseAmount,
        dose_unit_id: med.doseUnitId,
        treatment_doses: formatDoseDisplay(med.doseAmount, doseUnit.value, doseUnit.code),
        food_timing_id: med.foodTimingId,
        schedule: med.schedule,
        schedule_preset_id: med.schedulePresetId,
        medicine_notes: med.medicineNotes,
        start_date: input.visitDate,
      };
    });

    const visit = await healthRepository.createVisit(tenantId, userId, input, medicineRows);

    await healthRepository.updateStudentHealthStatus(
      input.studentId,
      tenantId,
      mapHealthStatus(severity.code),
      userId,
    );

    return visit;
  },
};
