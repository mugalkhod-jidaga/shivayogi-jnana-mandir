export type EnrollmentType = 'NEW' | 'PROMOTED' | 'REPEATED' | 'TRANSFERRED';

export type EnrollmentTypeCounts = Record<EnrollmentType, number>;

export type EnrollmentStatsStandard = {
  standardId: number;
  label: string;
  sortOrder: number;
  total: number;
  byType: EnrollmentTypeCounts;
};

export type EnrollmentStats = {
  academicYear: { id: number; label: string } | null;
  statusFilter: string | null;
  standards: EnrollmentStatsStandard[];
  totals: { total: number; byType: EnrollmentTypeCounts };
};

export type PromoteStudentsPayload = {
  targetAcademicYearId: number;
  sourceStandardId: number;
  targetStandardId: number;
  studentIds?: string[];
  excludeStudentIds?: string[];
  holdbackStudentIds?: string[];
  dryRun?: boolean;
};

export type PromotionSkippedEntry = {
  studentId: string;
  reason: string;
};

export type PromotionAffectedEntry = {
  studentId: string;
  enrollmentType: EnrollmentType;
  standardId: number;
};

export type PromotionResult = {
  dryRun: boolean;
  promoted: number;
  repeated: number;
  skipped: PromotionSkippedEntry[];
  affected: PromotionAffectedEntry[];
};
