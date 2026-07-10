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

export type HealthVisitAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadStatus: string;
};

export type MedicineCatalogItem = {
  id: string;
  name: string;
  issueTypes: string[];
  defaultDoseAmount: string | null;
  defaultSchedule: MedicineSchedule | null;
  useCount: number;
  isCustom: boolean;
  defaultDoseUnit: { id: number; code: string; value: string } | null;
  defaultFoodTiming: { id: number; code: string; value: string } | null;
  defaultSchedulePreset: { id: number; code: string; value: string } | null;
};

export type HealthStaffOption = {
  id: string;
  firstName: string;
  lastName: string | null;
  phoneNumber: string;
  status: string;
};

export type HealthDashboardStats = {
  totalStudents: number;
  sickToday: number;
  urgentCount: number;
  visitsThisWeek: number;
  urgentAlerts: HealthVisit[];
  recentEntries: HealthVisit[];
};

export type VisitAttachmentInput = {
  key: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
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
  attachments: HealthVisitAttachment[];
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
  attachments?: VisitAttachmentInput[];
};

export type HealthVisitListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  severityId?: number;
  standardId?: number;
  from?: string;
  to?: string;
};
