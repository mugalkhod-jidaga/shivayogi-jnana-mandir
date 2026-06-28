export type StandardBreakdown = {
  standardId: number;
  label: string;
  count: number;
};

export type CategoryBreakdown = {
  categoryId: number;
  label: string;
  count: number;
};

export type DashboardSummary = {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  activeStaff: number;
  admissionsThisMonth: number;
  admissionsThisAcademicYear: number;
  currentAcademicYear: string | null;
  studentsByStandard: StandardBreakdown[];
  studentsByCategory: CategoryBreakdown[];
};

export type ComplianceReportRow = {
  studentId: string;
  admissionNumber: string;
  name: string;
  missingDocumentTypes: string[];
};

export type AuditLogEntry = {
  id: string;
  tenantId: number;
  userId: string | null;
  entityType: string;
  entityId: string | null;
  actionType: string;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
};
