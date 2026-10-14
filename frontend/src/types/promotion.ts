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
  /** Omitted when promoting out of the final standard (students become Alumni). */
  targetStandardId?: number;
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
  enrollmentType: EnrollmentType | 'ALUMNI';
  standardId: number;
};

export type PromotionCandidate = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  rollNumber: string | null;
};

export type PromotionCandidates = {
  sourceAcademicYearLabel: string;
  targetAcademicYearLabel: string;
  isFinalStandard: boolean;
  expectedTargetStandardId: number | null;
  students: PromotionCandidate[];
};

export type PromotionResult = {
  dryRun: boolean;
  promoted: number;
  repeated: number;
  graduated: number;
  skipped: PromotionSkippedEntry[];
  affected: PromotionAffectedEntry[];
};
