import { ArrowLeft, HeartPulse } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { Button } from '@/components/ui/button';
import { HealthStatusBadge } from '@/features/health/components/HealthStatusBadge';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import {
  useHealthVisit,
  useStudentHealthSummary,
  useStudentHealthVisits,
} from '@/hooks/useHealth';
import { useStudent } from '@/hooks/useStudent';
import { formatDobDisplay } from '@/lib/date';
import { genderLabel } from '@/lib/enumLabels';

export function StudentHealthProfilePage() {
  const { t } = useTranslation('health');
  const { t: tc } = useTranslation();
  const { studentId } = useParams();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const { data: student, isLoading: studentLoading, isError } = useStudent(studentId);
  const { data: summary } = useStudentHealthSummary(studentId);
  const { data: visitsData, isLoading: visitsLoading } = useStudentHealthVisits(studentId, {
    page: 1,
    limit: 50,
  });
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  if (!studentId) return <Navigate to="/health/recent" replace />;

  if (studentLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (isError || !student) {
    return <Navigate to="/students" replace />;
  }

  const visits = visitsData?.data ?? [];
  const name = [student.firstName, student.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 px-2">
        <Link to={`/students/${studentId}`}>
          <ArrowLeft className="size-4" />
          {t('profile.backToStudent')}
        </Link>
      </Button>

      <ModuleHeroBanner
        title={name}
        description={`${student.admissionNumber}${student.currentEnrollment?.standard?.value ? ` · ${t('record.class')} ${student.currentEnrollment.standard.value}` : ''}`}
        tagline={t('hero.tagline')}
        icon={HeartPulse}
        gradientClassName={MODULE_GRADIENTS.health}
      >
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link to={`/health/record-visit?studentId=${student.id}`}>{t('profile.recordVisit')}</Link>
        </Button>
      </ModuleHeroBanner>

      <section className="grid gap-4 rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50/30 to-transparent p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-teal-900/30 dark:from-teal-950/15">
        <div>
          <p className="text-xs text-muted-foreground">{t('profile.healthStatusLabel')}</p>
          <div className="mt-1">
            <HealthStatusBadge status={student.healthStatus} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('profile.bloodGroup')}</p>
          <p className="mt-1 text-sm font-medium">{student.bloodGroup?.value ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('profile.dob')}</p>
          <p className="mt-1 text-sm">{formatDobDisplay(student.dob)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('profile.gender')}</p>
          <p className="mt-1 text-sm">{genderLabel(tc, student.gender)}</p>
        </div>
        {student.medicalAlerts && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-muted-foreground">{t('profile.allergies')}</p>
            <p className="mt-1 text-sm">{student.medicalAlerts}</p>
          </div>
        )}
        {student.familyDetails?.guardianName && (
          <div>
            <p className="text-xs text-muted-foreground">{t('profile.guardian')}</p>
            <p className="mt-1 text-sm">{student.familyDetails.guardianName}</p>
          </div>
        )}
        {student.familyDetails?.primaryContact && (
          <div>
            <p className="text-xs text-muted-foreground">{t('profile.guardianPhone')}</p>
            <p className="mt-1 text-sm">{student.familyDetails.primaryContact}</p>
          </div>
        )}
      </section>

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
        <h2 className="text-lg font-semibold">{t('profile.visitHistory')}</h2>
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
                  · {t('recent.photoCount', { count: visit.attachments.length })}
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
