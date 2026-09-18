import { useMemo, useState } from 'react';
import { ArrowRight, GraduationCap, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AcademicStandardSelect } from '@/components/lookups/AcademicStandardSelect';
import { AcademicYearSelect } from '@/components/lookups/AcademicYearSelect';
import { useStudentsList } from '@/hooks/useStudents';
import { useEnrollmentStats, usePromoteStudents } from '@/hooks/usePromotions';
import type { PromotionResult } from '@/types/promotion';

function fullName(firstName: string, lastName: string | null) {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

export function PromoteStudentsPage() {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();

  const [sourceStandardId, setSourceStandardId] = useState('');
  const [targetStandardId, setTargetStandardId] = useState('');
  const [targetAcademicYearId, setTargetAcademicYearId] = useState('');
  const [holdbackIds, setHoldbackIds] = useState<Set<string>>(new Set());
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set());
  const [previewResult, setPreviewResult] = useState<PromotionResult | null>(null);

  const promote = usePromoteStudents();

  const sourceStandardNum = sourceStandardId ? Number(sourceStandardId) : undefined;
  const targetStandardNum = targetStandardId ? Number(targetStandardId) : undefined;
  const targetYearNum = targetAcademicYearId ? Number(targetAcademicYearId) : undefined;

  const eligibleStudents = useStudentsList(
    { standardId: sourceStandardNum, status: 'Active', limit: 100 },
    { enabled: Boolean(sourceStandardNum) },
  );

  const targetYearStats = useEnrollmentStats(
    { academicYearId: targetYearNum, standardId: targetStandardNum },
    { enabled: Boolean(targetYearNum) },
  );

  const readyToRun = Boolean(sourceStandardNum && targetStandardNum && targetYearNum);
  const students = sourceStandardNum ? (eligibleStudents.data?.data ?? []) : [];

  const invalidateSelections = () => setPreviewResult(null);

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

  const payload = useMemo(
    () =>
      sourceStandardNum && targetStandardNum && targetYearNum
        ? {
            sourceStandardId: sourceStandardNum,
            targetStandardId: targetStandardNum,
            targetAcademicYearId: targetYearNum,
            excludeStudentIds: [...excludeIds],
            holdbackStudentIds: [...holdbackIds],
          }
        : null,
    [sourceStandardNum, targetStandardNum, targetYearNum, excludeIds, holdbackIds],
  );

  async function runPreview() {
    if (!payload) return;
    try {
      const result = await promote.mutateAsync({ ...payload, dryRun: true });
      setPreviewResult(result);
    } catch {
      toast.error(t('promote.errors.previewFailed'));
    }
  }

  async function confirmPromotion() {
    if (!payload) return;
    try {
      const result = await promote.mutateAsync({ ...payload, dryRun: false });
      toast.success(t('promote.success', { promoted: result.promoted, repeated: result.repeated }));
      setPreviewResult(null);
      setHoldbackIds(new Set());
      setExcludeIds(new Set());
    } catch {
      toast.error(t('promote.errors.promoteFailed'));
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
            <AcademicStandardSelect
              id="sourceStandard"
              value={sourceStandardId}
              onChange={(value) => {
                setSourceStandardId(value);
                setHoldbackIds(new Set());
                setExcludeIds(new Set());
                invalidateSelections();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetStandard">{t('promote.setup.targetStandard')}</Label>
            <AcademicStandardSelect
              id="targetStandard"
              value={targetStandardId}
              onChange={(value) => {
                setTargetStandardId(value);
                invalidateSelections();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetYear">{t('promote.setup.targetYear')}</Label>
            <AcademicYearSelect
              id="targetYear"
              value={targetAcademicYearId}
              onChange={(value) => {
                setTargetAcademicYearId(value);
                invalidateSelections();
              }}
            />
          </div>
        </div>
      </ModuleSectionCard>

      {sourceStandardNum && (
        <ModuleSectionCard
          title={t('promote.roster.title')}
          description={t('promote.roster.description')}
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
              <ListChecks className="size-5" />
            </div>
          }
        >
          {eligibleStudents.isLoading && (
            <p className="text-sm text-muted-foreground">{tc('loading')}</p>
          )}

          {!eligibleStudents.isLoading && students.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('promote.roster.empty')}</p>
          )}

          {!eligibleStudents.isLoading && students.length > 0 && (
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
                      <td className="py-2">{student.currentEnrollment?.rollNumber ?? '—'}</td>
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
                {t('promote.roster.help', {
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
            <Button variant="outline" onClick={runPreview} disabled={promote.isPending}>
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
                {t('promote.run.previewSummary', {
                  promoted: previewResult.promoted,
                  repeated: previewResult.repeated,
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
