export type CountBreakdown = {
  label: string;
  count: number;
};

export type SeverityBreakdown = {
  severityId: number;
  code: string;
  label: string;
  count: number;
};

export type DayBreakdown = {
  date: string;
  count: number;
};

export type HealthStatusBreakdown = {
  status: string;
  count: number;
};

export type HealthReportSummary = {
  totalVisits: number;
  visitsThisMonth: number;
  uniqueStudentsVisited: number;
  rangeDays: number | null;
  visitsBySeverity: SeverityBreakdown[];
  visitsByDay: DayBreakdown[];
  topIssueTypes: CountBreakdown[];
  topMedicines: CountBreakdown[];
  studentsByHealthStatus: HealthStatusBreakdown[];
};
