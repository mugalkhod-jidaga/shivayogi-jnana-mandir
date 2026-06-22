export type DashboardSummary = {
  totalStudents: number;
  activeStudents: number;
  alumniCount: number;
  documentsComplete: number;
  documentsPending: number;
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
