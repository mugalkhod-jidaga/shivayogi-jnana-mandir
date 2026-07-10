import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import { useHealthVisit, useRecentHealthVisits } from '@/hooks/useHealth';

export function RecentVisitsPage() {
  const { t } = useTranslation('health');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const { data: visits, isLoading } = useRecentHealthVisits(appliedSearch || undefined);
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('recent.description')}</p>

      <form
        className="flex gap-2 rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50/40 to-cyan-50/30 p-4 dark:border-teal-900/30 dark:from-teal-950/20 dark:to-cyan-950/15"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedSearch(search);
        }}
      >
        <Input
          placeholder={t('recent.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit">{t('recent.search')}</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}

      {!isLoading && (visits ?? []).length === 0 && (
        <p className="text-muted-foreground">{t('recent.empty')}</p>
      )}

      <div className="space-y-3">
        {(visits ?? []).map((visit) => (
          <button
            key={visit.id}
            type="button"
            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => setSelectedVisitId(visit.id)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/health/students/${visit.studentId}`}
                className="font-medium text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {formatStudentName(visit)}
              </Link>
              <span className="text-sm text-muted-foreground">{visit.student.admissionNumber}</span>
              <span className="text-sm text-muted-foreground">· {visit.visitDate}</span>
              <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
            </div>
            <p className="mt-1 text-sm font-medium">{visit.issueType}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{visit.symptoms}</p>
            {visit.medicines.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {visit.medicines.map((m) => m.medicineName).join(', ')}
              </p>
            )}
            {visit.attachments?.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('recent.photoCount', { count: visit.attachments.length })}
              </p>
            )}
          </button>
        ))}
      </div>

      <VisitDetailModal
        visit={selectedVisit ?? null}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
}
