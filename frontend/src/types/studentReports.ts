export type StandardBreakdown = {
  standardId: number;
  label: string;
  count: number;
};

export type SocialCategoryBreakdown = {
  socialCategoryId: number;
  label: string;
  count: number;
};

export type GenderBreakdown = {
  gender: string;
  count: number;
};

export type StatusBreakdown = {
  status: string;
  count: number;
};

export type StudentReportSummary = {
  totalStudents: number;
  activeStudents: number;
  admissionsThisAcademicYear: number;
  currentAcademicYear: string | null;
  studentsByStandard: StandardBreakdown[];
  studentsBySocialCategory: SocialCategoryBreakdown[];
  studentsByGender: GenderBreakdown[];
  studentsByStatus: StatusBreakdown[];
};
