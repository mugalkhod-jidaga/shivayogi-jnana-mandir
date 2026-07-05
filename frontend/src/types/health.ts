export type HealthLookupOption = {
  id: number;
  code?: string;
  value: string;
  labels?: Record<string, string>;
};

export type DoseUnitOption = HealthLookupOption & {
  doseGroup: string;
};

export type MedicineSchedule = {
  morning: boolean;
  noon: boolean;
  evening: boolean;
  night: boolean;
};

export type HealthVisitMedicine = {
  id: string;
  medicineName: string;
  doseAmount: string;
  treatmentDoses: string | null;
  schedule: MedicineSchedule;
  medicineNotes: string | null;
  doseUnit: HealthLookupOption & { doseGroup: string };
  foodTiming: HealthLookupOption;
  schedulePreset: HealthLookupOption;
};

export type HealthVisit = {
  id: string;
  studentId: string;
  visitDate: string;
  issueType: string;
  symptoms: string;
  treatedBy: string | null;
  notes: string | null;
  temperature: string | null;
  bloodPressure: string | null;
  oxygenLevel: string | null;
  createdAt: string;
  updatedAt: string;
  severity: HealthLookupOption & { code: string };
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNumber: string;
    healthStatus: string | null;
    bloodGroup: { id: number; value: string } | null;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
  medicines: HealthVisitMedicine[];
};

export type HealthVisitSummary = {
  visitCount: number;
  lastVisitDate: string | null;
  lastIssueType: string | null;
};

export type MedicineRowInput = {
  medicineName: string;
  doseAmount: string;
  doseUnitId: number;
  foodTimingId: number;
  schedule: MedicineSchedule;
  schedulePresetId: number;
  medicineNotes?: string;
};

export type CreateHealthVisitInput = {
  studentId: string;
  visitDate: string;
  issueType: string;
  symptoms: string;
  severityId: number;
  treatedBy?: string;
  notes?: string;
  temperature?: string;
  bloodPressure?: string;
  oxygenLevel?: string;
  medicines: MedicineRowInput[];
};

export type HealthVisitListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  severityId?: number;
};
