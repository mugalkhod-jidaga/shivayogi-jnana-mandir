import { useMemo, useState } from 'react';
import { ArrowRight, GraduationCap, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useLookups } from '@/hooks/useLookups';
import { ApiError } from '@/lib/api';
import { useEnrollmentStats, usePromoteStudents, usePromotionCandidates } from '@/hooks/usePromotions';
import type { PromotionResult } from '@/types/promotion';
import {
  academicYearStart,
  findPreviousYear,
  resolveTargetStandard,
  validatePromotionSelection,
} from './promotionRules';

function fullName(firstName: string, lastName: string | null) {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

export function PromoteStudentsPage() {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const { academicStandards, academicYears } = useLookups();

  const [sourceStandardId, setSourceStandardId] = useState('');
  const [targetAcademicYearId, setTargetAcademicYearId] = useState('');
  const [holdbackIds, setHoldbackIds] = useState<Set<string>>(new Set());
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set());
  const [previewResult, setPreviewResult] = useState<PromotionResult | null>(null);

  const promote = usePromoteStudents();

  const sourceStandardNum = sourceStandardId ? Number(sourceStandardId) : undefined;
  const targetYearNum = targetAcademicYearId ? Number(targetAcademicYearId) : undefined;

  const activeStandards = useMemo(
    () => academicStandards.filter((s) => s.isActive),
    [academicStandards],
  );

  // The target standard is never chosen by the user: it is always source + 1,
  // or none at all when the source is the final standard (graduation).
  const { isFinal: isFinalStandard, target: lockedTarget } = useMemo(
    () => resolveTargetStandard(sourceStandardNum, academicStandards),
    [sourceStandardNum, academicStandards],
  );
  const targetStandardNum = lockedTarget?.id;

  // Newest first; a year is selectable only if the year before it exists.
  const sortedYears = useMemo(
    () =>
      [...academicYears].sort(
        (a, b) => (academicYearStart(b.label) ?? 0) - (academicYearStart(a.label) ?? 0),
      ),
    [academicYears],
  );
  const previousYear = findPreviousYear(targetYearNum, academicYears);

  const ruleError = validatePromotionSelection({
    sourceStandardId: sourceStandardNum,
    targetStandardId: targetStandardNum,
    targetYearId: targetYearNum,
    standards: academicStandards,
    years: academicYears,
  });
  // 'selectAll' just means the form isn't filled in yet; it's not worth shouting about.
  const visibleRuleError = ruleError && ruleError !== 'selectAll' ? ruleError : null;
  const readyToRun = ruleError === null;

  const candidates = usePromotionCandidates({
    sourceStandardId: readyToRun ? sourceStandardNum : undefined,
    targetAcademicYearId: readyToRun ? targetYearNum : undefined,
  });
  const students = readyToRun ? (candidates.data?.students ?? []) : [];
  const candidatesError =
    candidates.error instanceof ApiError ? candidates.error.message : candidates.error ? t('promote.errors.loadFailed') : null;

  const targetYearStats = useEnrollmentStats(
    { academicYearId: targetYearNum, standardId: targetStandardNum },
    { enabled: Boolean(targetYearNum) },
  );

  const invalidateSelections = () => setPreviewResult(null);

  function errorMessage(error: unknown, fallbackKey: string) {
    return error instanceof ApiError ? error.message : t(fallbackKey);
  }

  function toggleHoldback(id: string) {
    invalidateSelections();
    setHoldbackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setExcludeIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleExclude(id: string) {
    invalidateSelections();
    setExcludeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHoldbackIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // Send the visible roster as an explicit list so the batch matches exactly
  // what the user reviewed (the server still re-applies every rule).
  const payload = useMemo(() => {
    const included = (candidates.data?.students ?? [])
      .map((s) => s.id)
      .filter((id) => !excludeIds.has(id));
    if (!readyToRun || !sourceStandardNum || !targetYearNum || included.length === 0) return null;
    return {
      sourceStandardId: sourceStandardNum,
      ...(targetStandardNum ? { targetStandardId: targetStandardNum } : {}),
      targetAcademicYearId: targetYearNum,
      studentIds: included,
      excludeStudentIds: [],
      holdbackStudentIds: [...holdbackIds],
    };
  }, [readyToRun, sourceStandardNum, targetStandardNum, targetYearNum, candidates.data, excludeIds, holdbackIds]);

  function guard(): boolean {
    if (visibleRuleError) {
      toast.error(t(`promote.errors.${visibleRuleError}`));
      return false;
    }
    return payload !== null;
  }

  async function runPreview() {
    if (!guard() || !payload) return;
    try {
      const result = await promote.mutateAsync({ ...payload, dryRun: true });
      setPreviewResult(result);
    } catch (error) {
      toast.error(errorMessage(error, 'promote.errors.previewFailed'));
    }
  }

  async function confirmPromotion() {
    if (!guard() || !payload) return;
    try {
      const result = await promote.mutateAsync({ ...payload, dryRun: false });
      toast.success(
        t('promote.success', {
          promoted: result.promoted,
          repeated: result.repeated,
          graduated: result.graduated,
        }),
      );
      setPreviewResult(null);
      setHoldbackIds(new Set());
      setExcludeIds(new Set());
    } catch (error) {
      toast.error(errorMessage(error, 'promote.errors.promoteFailed'));
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('promote.description')}</p>

      <ModuleSectionCard
        title={t('promote.setup.title')}
        description={t('promote.setup.description')}
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <ArrowRight className="size-5" />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="sourceStandard">{t('promote.setup.sourceStandard')}</Label>
            <Select
              id="sourceStandard"
              value={sourceStandardId}
              onChange={(event) => {
                setSourceStandardId(event.target.value);
                setHoldbackIds(new Set());
                setExcludeIds(new Set());
                invalidateSelections();
              }}
            >
              <option value="">{tc('lookups.standard')}</option>
              {activeStandards.map((standard) => (
                <option key={standard.id} value={String(standard.id)}>
                  {standard.value}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetStandard">{t('promote.setup.targetStandard')}</Label>
            {/* Locked: always source + 1. Every other standard is shown disabled so the rule is visible. */}
            <Select
              id="targetStandard"
              value={targetStandardNum ? String(targetStandardNum) : isFinalStandard ? 'alumni' : ''}
              disabled
            >
              <option value="">{tc('lookups.standard')}</option>
              <option value="alumni">{t('promote.setup.alumni')}</option>
              {activeStandards.map((standard) => (
                <option
                  key={standard.id}
                  value={String(standard.id)}
                  disabled={standard.id !== targetStandardNum}
                >
                  {standard.value}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {isFinalStandard ? t('promote.setup.finalHint') : t('promote.setup.targetLockedHint')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetYear">{t('promote.setup.targetYear')}</Label>
            <Select
              id="targetYear"
              value={targetAcademicYearId}
              onChange={(event) => {
                setTargetAcademicYearId(event.target.value);
                setHoldbackIds(new Set());
                setExcludeIds(new Set());
                invalidateSelections();
              }}
            >
              <option value="">{tc('lookups.academicYear')}</option>
              {sortedYears.map((year) => {
                const hasPrevious = findPreviousYear(year.id, academicYears) !== null;
                return (
                  <option key={year.id} value={String(year.id)} disabled={!hasPrevious}>
                    {hasPrevious ? year.label : `${year.label} — ${t('promote.setup.noPreviousYear')}`}
                  </option>
                );
              })}
            </Select>
            {previousYear && (
              <p className="text-xs text-muted-foreground">
                {t('promote.setup.sourceYearHint', { year: previousYear.label })}
              </p>
            )}
          </div>
        </div>
        {visibleRuleError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {t(`promote.errors.${visibleRuleError}`)}
          </p>
        )}
      </ModuleSectionCard>

      {readyToRun && (
        <ModuleSectionCard
          title={t('promote.roster.title')}
          description={t('promote.roster.description', {
            year: candidates.data?.sourceAcademicYearLabel ?? previousYear?.label ?? '',
          })}
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
              <ListChecks className="size-5" />
            </div>
          }
        >
          {candidates.isLoading && <p className="text-sm text-muted-foreground">{tc('loading')}</p>}

          {candidatesError && (
            <p role="alert" className="text-sm text-destructive">
              {candidatesError}
            </p>
          )}

          {!candidates.isLoading && !candidatesError && students.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('promote.roster.empty', { year: candidates.data?.sourceAcademicYearLabel ?? '' })}
            </p>
          )}

          {!candidates.isLoading && students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">{t('list.columns.admissionNumber')}</th>
                    <th className="py-2 font-medium">{t('list.columns.name')}</th>
                    <th className="py-2 font-medium">{t('list.columns.rollNumber')}</th>
                    <th className="py-2 text-center font-medium">{t('promote.roster.holdback')}</th>
                    <th className="py-2 text-center font-medium">{t('promote.roster.exclude')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-b-0">
                      <td className="py-2">{student.admissionNumber}</td>
                      <td className="py-2">{fullName(student.firstName, student.lastName)}</td>
                      <td className="py-2">{student.rollNumber ?? '—'}</td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={holdbackIds.has(student.id)}
                          onChange={() => toggleHoldback(student.id)}
                          aria-label={t('promote.roster.holdback')}
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={excludeIds.has(student.id)}
                          onChange={() => toggleExclude(student.id)}
                          aria-label={t('promote.roster.exclude')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                {t(isFinalStandard ? 'promote.roster.helpFinal' : 'promote.roster.help', {
                  count: students.length - holdbackIds.size - excludeIds.size,
                  holdback: holdbackIds.size,
                  exclude: excludeIds.size,
                })}
              </p>
            </div>
          )}
        </ModuleSectionCard>
      )}

      {readyToRun && (
        <ModuleSectionCard title={t('promote.run.title')} description={t('promote.run.description')}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={runPreview} disabled={promote.isPending || !payload}>
              {promote.isPending ? tc('loading') : t('promote.run.preview')}
            </Button>
            <Button
              onClick={confirmPromotion}
              disabled={!previewResult || promote.isPending}
              variant="default"
            >
              {promote.isPending ? tc('saving') : t('promote.run.confirm')}
            </Button>
            {!previewResult && (
              <span className="text-xs text-muted-foreground">{t('promote.run.previewFirst')}</span>
            )}
          </div>

          {previewResult && (
            <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">
                {t(isFinalStandard ? 'promote.run.previewSummaryFinal' : 'promote.run.previewSummary', {
                  promoted: previewResult.promoted,
                  repeated: previewResult.repeated,
                  graduated: previewResult.graduated,
                  skipped: previewResult.skipped.length,
                })}
              </p>
              {previewResult.skipped.length > 0 && (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {previewResult.skipped.map((entry) => (
                    <li key={entry.studentId}>
                      {entry.studentId}: {entry.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </ModuleSectionCard>
      )}

      {targetYearNum && (
        <ModuleSectionCard
          title={t('promote.stats.title')}
          description={t('promote.stats.description')}
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <GraduationCap className="size-5" />
            </div>
          }
        >
          {targetYearStats.isLoading && (
            <p className="text-sm text-muted-foreground">{tc('loading')}</p>
          )}

          {!targetYearStats.isLoading && (targetYearStats.data?.standards.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">{t('promote.stats.empty')}</p>
          )}

          {!targetYearStats.isLoading && (targetYearStats.data?.standards.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">{t('reports.byStandard.columnStandard')}</th>
                    <th className="py-2 text-right font-medium">{t('promote.stats.new')}</th>
                    <th className="py-2 text-right font-medium">{t('promote.stats.promoted')}</th>
                    <th className="py-2 text-right font-medium">{t('promote.stats.repeated')}</th>
                    <th className="py-2 text-right font-medium">{t('promote.stats.transferred')}</th>
                    <th className="py-2 text-right font-medium">{t('reports.byStandard.columnStudents')}</th>
                  </tr>
                </thead>
                <tbody>
                  {targetYearStats.data?.standards.map((row) => (
                    <tr key={row.standardId} className="border-b last:border-b-0">
                      <td className="py-2 font-medium">{row.label}</td>
                      <td className="py-2 text-right tabular-nums">{row.byType.NEW}</td>
                      <td className="py-2 text-right tabular-nums">{row.byType.PROMOTED}</td>
                      <td className="py-2 text-right tabular-nums">{row.byType.REPEATED}</td>
                      <td className="py-2 text-right tabular-nums">{row.byType.TRANSFERRED}</td>
                      <td className="py-2 text-right font-medium tabular-nums">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModuleSectionCard>
      )}
    </div>
  );
}
