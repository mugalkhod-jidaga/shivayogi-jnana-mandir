import { useTranslation } from 'react-i18next';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import type { HealthVisit, HealthVisitSummary } from '@/types/health';

type Props = {
  summary: HealthVisitSummary | undefined;
  visits: HealthVisit[];
  loading: boolean;
  onVisitClick?: (visitId: string) => void;
};

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function VisitHistoryPanel({ summary, visits, loading, onVisitClick }: Props) {
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
          <button
            key={visit.id}
            type="button"
            className="w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted/50"
            onClick={() => onVisitClick?.(visit.id)}
          >
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <span>{visit.visitDate}</span>
              <span className="text-muted-foreground">· {visit.issueType}</span>
              <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
              {visit.attachments?.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {visit.attachments.length} 📷
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-muted-foreground">{visit.symptoms}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function formatStudentName(visit: HealthVisit) {
  return formatName(visit.student.firstName, visit.student.lastName);
}
