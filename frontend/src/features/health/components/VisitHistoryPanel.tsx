import { useTranslation } from 'react-i18next';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import type { HealthVisit, HealthVisitSummary } from '@/types/health';

type Props = {
  summary: HealthVisitSummary | undefined;
  visits: HealthVisit[];
  loading: boolean;
};

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function VisitHistoryPanel({ summary, visits, loading }: Props) {
  const { t } = useTranslation('health');

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (!summary?.visitCount) {
    return <p className="text-sm text-muted-foreground">{t('record.noPriorVisits')}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('record.priorVisitsSummary', {
          count: summary.visitCount,
          date: summary.lastVisitDate ?? '',
          issue: summary.lastIssueType ?? '',
        })}
      </p>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {visits.map((visit) => (
          <details key={visit.id} className="rounded-md border p-3 text-sm">
            <summary className="flex cursor-pointer items-center gap-2 font-medium">
              <span>{visit.visitDate}</span>
              <span className="text-muted-foreground">· {visit.issueType}</span>
              <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
            </summary>
            <p className="mt-2 text-muted-foreground">{visit.symptoms}</p>
            {visit.medicines.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                {visit.medicines.map((med) => (
                  <li key={med.id}>
                    {med.medicineName} — {med.treatmentDoses ?? `${med.doseAmount} ${med.doseUnit.value}`}
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}

export function formatStudentName(visit: HealthVisit) {
  return formatName(visit.student.firstName, visit.student.lastName);
}
