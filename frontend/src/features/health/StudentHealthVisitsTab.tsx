import { HeartPulse } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { HealthStatusBadge } from '@/features/health/components/HealthStatusBadge';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import {
  useHealthVisit,
  useStudentHealthSummary,
  useStudentHealthVisits,
  useUpdateStudentHealthStatus,
} from '@/hooks/useHealth';

type Props = {
  studentId: string;
  student: {
    healthStatus?: string | null;
    bloodGroup?: { value: string } | null;
    medicalAlerts?: string | null;
  };
};

export function StudentHealthVisitsTab({ studentId, student }: Props) {
  const { t } = useTranslation('health');
  const location = useLocation();
  const fromPath = `${location.pathname}${location.search}`;
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [markedRecovered, setMarkedRecovered] = useState(false);
  const updateHealthStatus = useUpdateStudentHealthStatus();

  const { data: summary } = useStudentHealthSummary(studentId);
  const { data: visitsData, isLoading: visitsLoading } = useStudentHealthVisits(studentId, {
    page: 1,
    limit: 50,
  });
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  const visits = visitsData?.data ?? [];
  const canMarkRecovered = student.healthStatus === 'sick' || student.healthStatus === 'recovering';

  const handleMarkRecovered = async () => {
    setStatusError(null);
    setMarkedRecovered(false);
    try {
      await updateHealthStatus.mutateAsync({ studentId, healthStatus: 'healthy' });
      setMarkedRecovered(true);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : t('profile.markRecoveredFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('profile.healthStatusLabel')}</p>
            <div className="mt-1">
              <HealthStatusBadge status={student.healthStatus} />
            </div>
          </div>
          {student.bloodGroup && (
            <div>
              <p className="text-xs text-muted-foreground">{t('profile.bloodGroup')}</p>
              <p className="mt-1 text-sm font-medium">{student.bloodGroup.value}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canMarkRecovered && (
            <RequirePermission permission="medical:create">
              <Button
                type="button"
                variant="outline"
                disabled={updateHealthStatus.isPending}
                onClick={() => void handleMarkRecovered()}
              >
                {updateHealthStatus.isPending
                  ? t('profile.markingRecovered')
                  : t('profile.markRecovered')}
              </Button>
            </RequirePermission>
          )}
          <RequirePermission permission="medical:create">
            <Button asChild>
              <Link to={`/health/record-visit?studentId=${studentId}`} state={{ from: fromPath }}>
                <HeartPulse className="size-4" />
                {t('profile.recordVisit')}
              </Link>
            </Button>
          </RequirePermission>
          <Button asChild variant="outline">
            <Link to={`/health/students/${studentId}`} state={{ from: fromPath }}>
              {t('profile.openInHealth')}
            </Link>
          </Button>
        </div>
      </div>

      {statusError && <p className="text-sm text-destructive">{statusError}</p>}
      {markedRecovered && (
        <p className="text-sm text-teal-700 dark:text-teal-300">{t('profile.markRecoveredSuccess')}</p>
      )}

      {student.medicalAlerts && (
        <p className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <span className="font-medium">{t('profile.allergies')}: </span>
          {student.medicalAlerts}
        </p>
      )}

      {summary && summary.visitCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('record.priorVisitsSummary', {
            count: summary.visitCount,
            date: summary.lastVisitDate ?? '',
            issue: summary.lastIssueType ?? '',
          })}
        </p>
      )}

      <section className="space-y-3">
        <h3 className="text-base font-semibold">{t('profile.visitHistory')}</h3>
        {visitsLoading && <p className="text-muted-foreground">{t('loading')}</p>}
        {!visitsLoading && visits.length === 0 && (
          <p className="text-muted-foreground">{t('profile.noVisits')}</p>
        )}
        {visits.map((visit) => (
          <button
            key={visit.id}
            type="button"
            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => setSelectedVisitId(visit.id)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{visit.visitDate}</span>
              <span className="text-muted-foreground">· {visit.issueType}</span>
              <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
              {visit.attachments?.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {t('visits.photoCount', { count: visit.attachments.length })}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{visit.symptoms}</p>
            {visit.medicines.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {visit.medicines.map((m) => m.medicineName).join(', ')}
              </p>
            )}
          </button>
        ))}
      </section>

      <VisitDetailModal
        visit={selectedVisit ?? null}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
}
