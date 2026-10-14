import type { AcademicStandardOption, AcademicYearOption } from '@/types/lookup';

/** Mirrors `academic_year_start()` in migration 021: years order by the label's 4-digit start year. */
export function academicYearStart(label: string): number | null {
  const match = /^\s*(\d{4})/.exec(label);
  return match ? Number(match[1]) : null;
}

/** Sentinel sort order the backend uses for the "Unassigned" standard. */
const UNASSIGNED_SORT_ORDER = 99;

function promotable(standards: AcademicStandardOption[]) {
  return standards.filter((s) => s.isActive && s.sortOrder < UNASSIGNED_SORT_ORDER);
}

export type TargetStandardResolution = {
  isFinal: boolean;
  /** The only legal target (source + 1). Null when the source is final or unknown. */
  target: AcademicStandardOption | null;
};

export function resolveTargetStandard(
  sourceId: number | undefined,
  standards: AcademicStandardOption[],
): TargetStandardResolution {
  const pool = promotable(standards);
  const source = pool.find((s) => s.id === sourceId);
  if (!source) return { isFinal: false, target: null };

  const finalSort = Math.max(...pool.map((s) => s.sortOrder));
  if (source.sortOrder >= finalSort) return { isFinal: true, target: null };

  return { isFinal: false, target: pool.find((s) => s.sortOrder === source.sortOrder + 1) ?? null };
}

/** The year immediately before `target` (by label start year), or null if none exists. */
export function findPreviousYear(
  targetYearId: number | undefined,
  years: AcademicYearOption[],
): AcademicYearOption | null {
  const target = years.find((y) => y.id === targetYearId);
  const targetStart = target ? academicYearStart(target.label) : null;
  if (targetStart === null) return null;
  return years.find((y) => academicYearStart(y.label) === targetStart - 1) ?? null;
}

export type PromotionRuleError =
  | 'selectAll'
  | 'standardNotIncremental'
  | 'noTargetStandard'
  | 'noPreviousYear';

/**
 * Client-side guard. The server re-checks the same rules (`promotion_context`);
 * this just fails fast with a readable message.
 */
export function validatePromotionSelection(params: {
  sourceStandardId?: number;
  targetStandardId?: number;
  targetYearId?: number;
  standards: AcademicStandardOption[];
  years: AcademicYearOption[];
}): PromotionRuleError | null {
  const { sourceStandardId, targetStandardId, targetYearId, standards, years } = params;
  if (!sourceStandardId || !targetYearId) return 'selectAll';

  if (!findPreviousYear(targetYearId, years)) return 'noPreviousYear';

  const { isFinal, target } = resolveTargetStandard(sourceStandardId, standards);
  if (isFinal) return null; // graduates to Alumni; no target standard
  if (!target) return 'noTargetStandard';
  if (targetStandardId !== target.id) return 'standardNotIncremental';
  return null;
}
